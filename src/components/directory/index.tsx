import { Input, message, Tree } from "antd";
import React, { useEffect, useState } from "react";

import { sep } from "@tauri-apps/api/path";
import {
  BaseDirectory,
  DirEntry,
  readDir,
  rename,
} from "@tauri-apps/plugin-fs";

interface DataNode extends DirEntry {
  children?: DataNode[];
  path: string;
  key: string;
  isLeaf: boolean;
  title: string;
}

console.log(BaseDirectory);
const baseDir = "/";

const initTreeData: DataNode[] = [];

// It's just a simple demo. You can use tree map to optimize update perf.
const updateTreeData = (
  list: DataNode[],
  key: React.Key,
  children: DataNode[],
): DataNode[] =>
  list.map((node) => {
    if (node.key === key) {
      return {
        ...node,
        children,
      };
    }
    if (node.children) {
      return {
        ...node,
        children: updateTreeData(node.children, key, children),
      };
    }
    return node;
  });

const Index: React.FC = () => {
  const [treeData, setTreeData] = useState(initTreeData);

  const initialTreeValue = () => {
    readDir(baseDir)
      .then((entries) => {
        setTreeData(
          entries.map((entry) => {
            const path = baseDir + sep() + entry.name;
            return {
              ...entry,
              isLeaf: !entry.isDirectory,
              title: entry.name,
              key: path,
              path: path,
            };
          }),
        );
      })
      .catch((e) => {
        console.error(e);
      });
  };

  useEffect(() => {
    initialTreeValue();
  }, []);

  const onLoadData = ({ key, children, path }: DataNode) =>
    new Promise<void>((resolve) => {
      if (children) {
        resolve();
        return;
      }
      readDir(path)
        .then((entries) => {
          const subs = entries.map((entry) => {
            const subpath = path + sep() + entry.name;
            return {
              ...entry,
              isLeaf: !entry.isDirectory,
              title: entry.name,
              key: subpath,
              path: subpath,
            };
          });
          setTreeData((origin) => updateTreeData(origin, key, subs));
          resolve();
        })
        .catch((e) => {
          resolve();
          message.error(e).then(() => {});
        });
    });

  const [editingNodeKey, setEditingNodeKey] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>("");

  const onEdit = (key: string, title: string) => {
    setEditingNodeKey(key);
    setEditingValue(title);
  };

  const onConfirmEdit = (key: string) => {
    const updateTreeData = (data: DataNode[]): DataNode[] => {
      return data.map((node) => {
        if (node.key === key) {
          return { ...node, title: editingValue };
        }
        if (node.children) {
          return { ...node, children: updateTreeData(node.children) };
        }
        return node;
      });
    };

    setTreeData(updateTreeData(treeData));
    setEditingNodeKey(null);
  };

  const renderTitle = (node: DataNode) => {
    const { title, key } = node;

    if (editingNodeKey === key) {
      return (
        <Input
          value={editingValue}
          onChange={(e) => {
            const newValue = node.path.replace(node.name, e.target.value);
            rename(node.path, newValue).then(() => {
              setEditingValue(e.target.value);
            });
          }}
          onBlur={() => onConfirmEdit(key)}
          onPressEnter={() => onConfirmEdit(key)}
          autoFocus
          style={{ width: 150 }}
        />
      );
    }

    return (
      <span
        onDoubleClick={() => onEdit(key, title)}
        style={{ cursor: "pointer" }}
      >
        {title}
      </span>
    );
  };

  return (
    <Tree
      loadData={onLoadData}
      treeData={treeData}
      titleRender={(node) => renderTitle(node)}
    />
  );
};

export default Index;
