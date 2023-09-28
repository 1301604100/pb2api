// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import * as path from "node:path";
import { projectServiceMap } from "./config";
import { generateApi, getServerName, writeStringToFile } from "./utils";
const { window } = vscode;

// 插件每次激活都会执行这个方法
export function activate(context: vscode.ExtensionContext) {
  // 注册命令
  let disposable = vscode.commands.registerCommand("pb2api.pb2api", (uri) => {
    // 获取编辑器对象
    const editor = window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage(`No active text editor!`);
      return;
    }

    // 当前选中的代码所处的绝对位置
    // const protoPath = uri.fsPath;
    const protoPath = editor.document.uri.fsPath;
    const protoFileName = path.basename(protoPath);
    console.log("protoFileName:", protoFileName);
    if (!protoFileName?.includes("proto")) {
      vscode.window.showErrorMessage(`Please use proto2api in proto file!`);
      return;
    }
    // api/index.ts 的绝对目录
    const apiIndexPath = path.resolve(protoPath, "../../api/index.ts");
    // 获取 项目名
    const projectPath = path.resolve(protoPath, "../../../");
    const projectName = projectPath.split("\\").at(-1);
    if (!projectName) {
      vscode.window.showErrorMessage("can not find project name");
      return;
    }
    console.log("projectPath, projectDir", projectPath, projectName);
    // 获取选中文本
    const doc = editor.document;
    const selection = editor.selection;
    const words = doc.getText(selection);
    console.log("selected words:", words);
    if (!words) {
      vscode.window.showErrorMessage(`Please selected text!`);
      return;
    }
    // 获取配置
    const config = vscode.workspace.getConfiguration("pb2api");
    const useTS = config.get("useTS", true);
    const serviceMap = config.get("projectServiceMap", projectServiceMap);

    // 转成 api
    let apiStr = "";
    try {
      apiStr = generateApi({
        protoStr: words,
        serverName: getServerName({
          fileName: protoFileName,
          projectName,
          projectServiceMap: serviceMap,
        }),
        useTS,
      });
    } catch (error: Error | any) {
      console.log("error:", error.message);
      vscode.window.showErrorMessage(error.message);
      return;
    }
    // console.log("apiStr", apiStr);
    // 写入
    writeStringToFile({ filePath: apiIndexPath, content: apiStr }, (err) => {
      if (err) {
        vscode.window.showErrorMessage(
          `Error appending to ${apiIndexPath}: ${err.message}`
        );
      } else {
        vscode.window.showInformationMessage(
          `Appended to ${apiIndexPath} successfully!`
        );
      }
    });
  });

  context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
