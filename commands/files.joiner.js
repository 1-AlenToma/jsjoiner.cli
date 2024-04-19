import fs from "fs";
import minify from "@node-minify/core";
import uglifyjs from "@node-minify/uglify-js";
import htmlMinifier from "@node-minify/html-minifier";
import cleanCSS from "@node-minify/clean-css";

const fileSpec = path => {
  let search = undefined;

  if (path.indexOf("*") != -1) {
    let lst = path
      .split("/")
      .reverse()[0]
      .replace(/\/|\*/g, "");
    search = lst
      .split(".")
      .filter(x => x.length > 0);
  }
  let item = {
    order: 100,
    search,
    folder: path
      .split("/")
      .reverse()
      .filter((x, i) => i > 0 && x.length > 0)
      .reverse()
      .join("/"),
    name: path.split("/").reverse()[0],
    cleanName: path
      .split("/")
      .reverse()[0]
      .split(".")
      .reverse()
      .filter((x, i) => i > 0)
      .reverse()
      .join("."),
    ext: !search
      ? path.split(".").reverse()[0]
      : "",
    path: path
  };
  if (
    !item.folder.startsWith(".") &&
    !item.folder.startsWith("/")
  ) {
    item.folder = "/" + item.folder;
  }

  return item;
};

const validFiles = (...paths) => {
  let files = [];
  for (let p of paths) {
    p = p.replace(/\'|\"/g, "").trim();
    if (
      p.endsWith("*") ||
      p.endsWith(".html") ||
      p.endsWith(".js") ||
      p.endsWith(".css")
    ) {
      files.push(p);
    } else {
      console.warn(
        p,
        "is not valid file",
        "valid files is js,html and css only",
        p,
        "will not be included!"
      );
    }
  }

  return files;
};

const minifyJsContent = content => {
  return new Promise((res, rej) => {
    minify({
      compressor: uglifyjs,
      content,
      type: "js",
      callback: function (err, min) {
        if (err) rej(err);
        else res(min);
      }
    });
  });
};

const minifyHtmlContent = content => {
  return new Promise((res, rej) => {
    minify({
      compressor: htmlMinifier,
      content,
      type: "html",
      callback: function (err, min) {
        if (err) rej(err);
        else res(min);
      }
    });
  });
};

const minifyCssContent = content => {
  return new Promise((res, rej) => {
    minify({
      compressor: cleanCSS,
      content,
      type: "css",
      callback: function (err, min) {
        if (err) rej(err);
        else res(min);
      }
    });
  });
};

const getFiles = (...paths) => {
  let files = [];

  for (let p of validFiles(...paths)) {
    let file = fileSpec(p);
    if (p.indexOf("*") != -1) {
      let folderContent = fs
        .readdirSync(file.folder)
        .map(x => file.folder + "/" + x);
      if (file.search)
        folderContent = folderContent.filter(x =>
          file.search.find(
            s => x.split(".").reverse()[0] == s
          )
        );
      files = [
        ...validFiles(...folderContent),
        ...files
      ];
    } else {
      files.push(p);
    }
  }

  return files.map(x => fileSpec(x));
};

export default async ({
  output,
  files,
  sort
}) => {
  try {
    sort = sort ? sort.split(",") : sort;
    output = fileSpec(output);
    let filesSpec = getFiles(...files.split(","));
    console.warn(
      "Parsed files\n",
      filesSpec.map(x => x.path).join("\n")
    );
    console.warn("Output file\n", output.path);
    let folder = ["js", "ts"].includes(output.ext)
      ? output.folder
      : output.path;
    let name = ["js", "ts"].includes(output.ext)
      ? output.name
      : "index.js";

    if (!fs.existsSync(folder))
      fs.mkdirSync(folder);
    console.log("will now clean", folder, name);
    let dirFiles = fs.readdirSync(folder);
    for (let f of dirFiles) {
      if (
        f.indexOf(name) != -1 ||
        (output.cleanName.length > 3 &&
          f.indexOf(output.cleanName) != -1)
      ) {
        fs.unlinkSync(folder + "/" + f);
      }
    }
    console.log("Reading content");
    for (let f of filesSpec) {
      f.content = fs.readFileSync(f.path, "utf8");
      f.path = `${folder}/${f.cleanName}`;
      if (f.ext == "html")
        f.content = await minifyHtmlContent(
          f.content
        );
      if (f.ext == "css")
        f.content = await minifyCssContent(
          f.content
        );
      if (f.ext == "js")
        f.content = await minifyJsContent(
          f.content
        );
    }

    filesSpec = [
      ...filesSpec.filter(x => x.ext == "js"),
      ...filesSpec.filter(x => x.ext == "css"),
      ...filesSpec.filter(x => x.ext == "html")
    ];

    if (sort && sort.length > 0) {
      for (let i = 0; i < sort.length; i++) {
        let s = sort[i];
        if (s && s.length > 0) {
          let j = filesSpec.filter(
            x =>
              x.ext == "js" &&
              x.name.indexOf(s) !== -1
          );

          if (j) j.order = i;
        }
      }
    }

    filesSpec = [
      ...filesSpec
        .filter(x => x.ext == "js")
        .sort((a, b) => a.order - b.order),
      ...filesSpec.filter(x => x.ext == "css"),
      ...filesSpec.filter(x => x.ext == "html")
    ];

    let fileIndex = {
      cleanName: "index.js",
      path: `${folder}/${name}`,
      content: `
        const arrayBuffer = (arr)=>{
          let str = "";
          for(let a of arr){
             str += String.fromCharCode(a);
          }
            return str;
          }
      `
    };

    let js = `
    try{
    let joinCss,joinjs = "";
    let joinFiles = ${JSON.stringify(
      filesSpec,
      undefined,
      4
    )}
    
    let validateScript=(id)=>{
      let item = document.getElementById(id);
      if(item)
        item.remove();
    }
    
    for (let file of joinFiles){
      validateScript(file.cleanName);
      if(file.ext === "html")
      {
        document.body.innerHTML += file.content;
      }else if (file.ext==="css"){
        joinCss= document.createElement("style");
        joinCss.id= file.cleanName;
        joinCss.appendChild(document.createTextNode(file.content));
        document.head.appendChild(joinCss)
      }else {
        joinjs= document.createElement("script");
        joinjs.id= file.cleanName;
        joinjs.appendChild(document.createTextNode(file.content));
        document.head.appendChild(joinjs);
      }
    }
    }catch(e){
      console.error(e)
    }
    `;
    console.log("Writing to", fileIndex.path);
    js = await minifyJsContent(js);
    fileIndex.content += `export default arrayBuffer([${js
      .split("")
      .map((x, i) => js.charCodeAt(i))
      .join(",")}]);`;
    fs.writeFileSync(
      fileIndex.path,
      fileIndex.content.trim(),
      "utf8"
    );

    console.log("done...");
   /* import("../data/" + name)
      .then(obj => {
        console.log(obj);
        fs.writeFileSync(
          `${folder}/content.js`,
          obj.default,
          "utf8"
        );
      })
      .catch(e => console.error(e));*/
  } catch (e) {
    console.error(e);
  }
};
