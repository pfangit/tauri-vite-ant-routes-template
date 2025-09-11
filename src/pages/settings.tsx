import { FormInstance, ProForm, ProFormText } from "@ant-design/pro-components";
import { open } from "@tauri-apps/plugin-dialog";
import { LazyStore } from "@tauri-apps/plugin-store";
import { Button, Skeleton } from "antd";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const DirectorySelector = ({ form }: { form: FormInstance }) => {
  return (
    <div
      onClick={async () => {
        const selectedPath = await open({
          multiple: false,
          directory: true,
        });

        form.setFieldValue("path", selectedPath);
      }}
    >
      ...
    </div>
  );
};

type SettingProps = { path: string; account: string; pwd: string };
type SettingKeyType = keyof SettingProps;

const Settings = () => {
  const [form] = ProForm.useForm();
  const [loading, setLoading] = useState<boolean>(true);

  const navigate = useNavigate();

  const [store, setStore] = useState<LazyStore | undefined>(undefined);

  const loadSettings = async () => {
    const storeObj = new LazyStore("settings.json", {
      autoSave: true,
      defaults: {
        path: "D:/执剑者",
        account: "",
        pwd: "",
      },
    });

    setStore(storeObj);
    const path = await storeObj.get<string>("path");
    const account = await storeObj.get<string>("account");
    const pwd = await storeObj.get<string>("pwd");
    form.setFieldValue("path", path);
    form.setFieldValue("account", account);
    form.setFieldValue("pwd", pwd);
  };

  useEffect(() => {
    loadSettings().then(() => setLoading(false));
  }, []);

  if (loading) {
    return <Skeleton />;
  }

  return (
    <div>
      <ProForm<SettingProps>
        form={form}
        onValuesChange={console.log}
        onFinish={async (values) => {
          Object.keys(values).forEach((key) => {
            store!.set(key, values[key as SettingKeyType]);
          });

          // You can manually save the store after making changes.
          // Otherwise, it will save upon graceful exit
          // And if you set `autoSave` to a number or left empty,
          // it will save the changes to disk after a debounce delay, 100ms by default.
          await store!.save();

          // todo 用户登录
          navigate("/dir");

          return true;
        }}
        submitter={{
          render: () => {
            return (
              <Button
                type="primary"
                onClick={() => {
                  form.submit();
                }}
              >
                登录
              </Button>
            );
          },
        }}
      >
        <ProFormText
          label="路径"
          name="path"
          rules={[
            {
              required: true,
              message: "请选择路径",
            },
          ]}
          fieldProps={{
            addonAfter: <DirectorySelector form={form} />,
          }}
        />
        <ProFormText
          label="账号"
          name={"account"}
          rules={[
            {
              required: true,
            },
          ]}
        />
        <ProFormText.Password
          label="密码"
          name={"pwd"}
          rules={[
            {
              required: true,
            },
          ]}
        />
      </ProForm>
    </div>
  );
};

export default Settings;
