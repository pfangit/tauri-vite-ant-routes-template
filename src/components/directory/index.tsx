import { Input, message, Tree } from "antd";
import React, { useEffect, useState } from "react";

import { invoke } from "@tauri-apps/api/core";
import { documentDir } from "@tauri-apps/api/path";
import { rename } from "@tauri-apps/plugin-fs";

type FileDir = {
  name: string;
  path: string;
  is_directory: boolean;
  children?: FileDir[];
};

type DataNode = {
  key: string;
  isLeaf: boolean;
  title: string;
  children?: DataNode[];
} & Omit<FileDir, "children">;

const baseDir = await documentDir();

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
  const [treeData, setTreeData] = useState<DataNode[]>(initTreeData);

  const directoriesAndFiles = async () => {
    const result = await invoke("list_files_and_directories", {
      dirPath: baseDir,
    });
    console.log("result", result);
    return result as FileDir;
  };

  const convertData = (item?: FileDir[]) => {
    if (item === null || item === undefined || item.length === 0) {
      return undefined;
    }
    return item.map((item): DataNode => {
      return {
        ...item,
        key: item.path,
        isLeaf: !item.is_directory,
        title: item.name,
        children: convertData(item.children),
      };
    });
  };

  useEffect(() => {
    directoriesAndFiles().then((result) => {
      return setTreeData(convertData([result]) || []);
    });
    // initialTreeValue();
  }, []);

  const onLoadData = ({ key, children, path }: DataNode) =>
    new Promise<void>(async (resolve) => {
      if (children) {
        resolve();
        return;
      }
      const entries = (await invoke("list_files_and_directories", {
        dirPath: path,
      }).catch((e) => {
        resolve();
        message.error(e).then(() => {});
      })) as unknown as FileDir[];
      const subs = entries.map((entry) => {
        return {
          ...entry,
          isLeaf: !entry.is_directory,
          title: entry.name,
          key: entry.path,
        } as DataNode;
      });
      setTreeData((origin) => updateTreeData(origin, key, subs));
      resolve();
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
