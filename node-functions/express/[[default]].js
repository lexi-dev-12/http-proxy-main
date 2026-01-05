import express from "express";
import formidable from 'formidable';
import FormData from 'form-data';
import { createReadStream } from 'fs';
import { Buffer } from 'buffer';

const app = express();

const apiKey = "app-iED3oMZNrWiKtXu5T5ASim2c";
const baseTarget = 'http://api.dify.woa.com/v1/';

// 日志中间件
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// 根路由
app.get("/", async (req, res) => {
  res.json({ message: "Hello from Express on Node Functions!"});
});
app.get("/info", async (req, res) => {
  const target = baseTarget + 'info';
        const fetchResponse = await fetch(baseTarget, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          // 如果需透传用户请求头，也可以在这里添加
        }
      });
  res.json({ message: "Hello from Express on Node Functions!" + fetchResponse});
});
// 根路由
app.post("/upload", async (req, res) => {
  const target = baseTarget + 'upload';
  res.json({ message: "Hello from Express on Node Functions!" + target});
  const fetchResponse = await fetch(target, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${apiKey}`,
    // 如果需透传用户请求头，也可以在这里添加
    }
  });
  res.json({ message: "Hello from Express on Node Functions!" + fetchResponse});
});




// 代理接口，拦截所有 /api/proxy 和子路由请求
// app.all("/api/proxy/:path*", async (req, res) => {
//   try {
//     const { method, url, headers } = req;

//     // 处理代理路径，获取路径参数并构建完整路径
//     const pathParam = req.params.path || '';
//     const pathWithoutPrefix = pathParam ? '/' + pathParam : '/';

//     // 根路径 /api/proxy 返回自定义信息
//     if (pathWithoutPrefix === '/' || pathWithoutPrefix === '') {
//       return res.status(200).json({ 
//         message: "Hello from Proxy API on Express!" 
//       });
//     }

//     // /infos 路径返回代理服务信息
//     if (pathWithoutPrefix === '/infos' || pathWithoutPrefix.startsWith('/infos?')) {
//       return res.status(200).json({ 
//         service: "Express Proxy Service",
//         version: "1.0.0",
//         endpoints: [
//           "/api/proxy - 根路径",
//           "/api/proxy/infos - 服务信息",
//           "/api/proxy/* - 代理转发到外部API"
//         ],
//         timestamp: new Date().toISOString()
//       });
//     }





//     // 目标 URL (包含去除代理前缀后的路径和查询字符串)
//     const queryString = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
//     const targetUrl = baseTarget + pathWithoutPrefix + queryString;

//     if (method === 'GET') {
//       // 代理 GET 请求
//       const fetchResponse = await fetch(targetUrl, {
//         method: 'GET',
//         headers: {
//           Authorization: `Bearer ${apiKey}`,
//           // 如果需透传用户请求头，也可以在这里添加
//         }
//       });

//       copyResponseHeaders(fetchResponse, res);

//       const data = Buffer.from(await fetchResponse.arrayBuffer());
//       return res.status(fetchResponse.status).send(data);
//     }


//     if (method === 'POST') {
//       const contentType = headers['content-type'] || '';

//       if (contentType.startsWith('multipart/form-data')) {
//         const { fields, files } = await parseMultipart(req);
//         const form = new FormData();

//         for (const key in fields) {
//           if (Array.isArray(fields[key])) {
//             fields[key].forEach(value => form.append(key, value));
//           } else {
//             form.append(key, fields[key]);
//           }
//         }

//         for (const key in files) {
//           const file = files[key];
//           if (Array.isArray(file)) {
//             for (const f of file) {
//               form.append(key, createReadStream(f.filepath), {
//                 filename: f.originalFilename,
//                 contentType: f.mimetype,
//               });
//             }
//           } else {
//             form.append(key, createReadStream(file.filepath), {
//               filename: file.originalFilename,
//               contentType: file.mimetype,
//             });
//           }
//         }

//         const fetchResponse = await fetch(targetUrl, {
//           method: 'POST',
//           headers: {
//             ...form.getHeaders(),
//             Authorization: `Bearer ${apiKey}`,
//           },
//           body: form,
//         });

//         copyResponseHeaders(fetchResponse, res);

//         const data = Buffer.from(await fetchResponse.arrayBuffer());
//         return res.status(fetchResponse.status).send(data);
//       } else {
//         // 普通 POST 请求，直接转发原始请求体
//         const rawBody = await readRawBody(req);

//         const fetchResponse = await fetch(targetUrl, {
//           method: 'POST',
//           headers: {
//             'Content-Type': contentType,
//             Authorization: `Bearer ${apiKey}`,
//           },
//           body: rawBody,
//         });

//         copyResponseHeaders(fetchResponse, res);

//         const data = Buffer.from(await fetchResponse.arrayBuffer());
//         return res.status(fetchResponse.status).send(data);
//       }
//     }

//     // 其他方法不支持
//     return res.status(405).json({ error: `不支持 ${method} 请求` });
//   }
//   catch (error) {
//     console.error('代理错误:', error);
//     res.status(500).json({ error: '代理内部错误', details: error.message });
//   }
// });


// // 复制 fetch 返回的响应头到 Express 响应
// function copyResponseHeaders(fetchResponse, expressRes) {
//   fetchResponse.headers.forEach((value, key) => {
//     if (![
//       'content-encoding',
//       'transfer-encoding',
//       'connection',
//       'content-length'
//     ].includes(key.toLowerCase())) {
//       expressRes.setHeader(key, value);
//     }
//   });
// }


// // formidable 解析 multipart/form-data
// function parseMultipart(req) {
//   return new Promise((resolve, reject) => {
//     const form = new formidable.IncomingForm();
//     form.parse(req, (err, fields, files) => {
//       if (err) reject(err);
//       else resolve({ fields, files });
//     });
//   });
// }


// // 读取原始请求体
// function readRawBody(req) {
//   return new Promise((resolve, reject) => {
//     const buffers = [];
//     req.on('data', (chunk) => buffers.push(chunk));
//     req.on('end', () => resolve(Buffer.concat(buffers)));
//     req.on('error', reject);
//   });
// }


// // // 启动服务
// // const port = process.env.PORT || 3000;
// // app.listen(port, () => {
// //   console.log(`Express server running on port ${port}`);
// // });
export default app;