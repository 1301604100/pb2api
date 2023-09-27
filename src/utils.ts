import * as fs from "node:fs";

export function generateApi(config: {
  protoStr: string;
  serverName: string;
  useTS: boolean;
}) {
  const { protoStr, serverName, useTS } = config;
  const infoList = getProtoInfoList(protoStr);
  if (infoList.length === 0) {
    throw new Error("Please select the full proto interface!");
  }
  let resStr = ``;
  infoList.forEach((item) => {
    resStr += `${getApiStr({
      ...item,
      serverName,
      useTS,
    })}\n\n`;
  });
  return resStr;
}

function getProtoInfoList(str: string) {
  // const regExp = /rpc\s*(\w+)\s*\((\w+)\)\s*returns\s*\((\w+)\)/gm
  const regExp =
    /(\/\/\s*.*?)?\s*rpc\s*(\w+)\s*\((\w+)\)\s*returns\s*\((\w+)\)/gm;
  let match;
  const infoList = [];
  while ((match = regExp.exec(str))) {
    const [_, annotation, funcName, reqDesction, resDesction] = match;
    if (!funcName || !reqDesction || !resDesction) {
      throw new Error("Please select the full proto interface!");
    }
    infoList.push({
      annotation: annotation?.trim(),
      funcName: funcName?.trim(),
      reqDesction: reqDesction?.trim(),
      resDesction: resDesction?.trim(),
    });
  }
  return infoList;
}

function getApiStr(info: {
  annotation: string;
  funcName: string;
  reqDesction: string;
  resDesction: string;
  serverName: string;
  useTS: boolean;
}) {
  const { annotation, funcName, reqDesction, resDesction, serverName, useTS } =
    info;
  let dataType;
  let returnType;
  if (useTS) {
    dataType =
      reqDesction !== "Empty"
        ? `: ExcludeNonNull<yunpb.I${reqDesction}>`
        : " = {}";
    returnType = `: Promise<ExcludeNonNull<yunpb.I${resDesction}>>`;
  } else {
    dataType = " = {}";
    returnType = "";
  }
  const str = `
${annotation || ""}
export const api${funcName} = (data${dataType}) ${returnType} => {
  return request({
    url: apiUrl,
    reqDesction: '${reqDesction}',
    resDesction: '${resDesction}',
    funcName: '${funcName}',
    serverName: '${serverName}',
    token: KEY,
    data,
  })
}`;
  return str;
}

function capitalizeFirstLetter(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function getServerName(config: {
  fileName: string;
  projectName: string;
  projectServiceMap: Record<string, string>;
}) {
  const { fileName, projectName, projectServiceMap } = config;
  const service = projectServiceMap[projectName];
  const name = fileName.split(".")[0];
  const fileExtObj = `${capitalizeFirstLetter(name)}ExtObj`;
  return `${service}.${name}.${fileExtObj}`;
}

// 函数来写入字符串到指定文件
export function writeStringToFile(
  config: { filePath: string; content: string },
  callback: (err: any) => void
) {
  const { filePath, content } = config;

  fs.appendFile(filePath, content, "utf8", callback);
}
