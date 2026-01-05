import formidable from 'formidable';
import FormData from 'form-data';
import { createReadStream } from 'fs';
import { Buffer } from 'buffer';

export const config = {
  api: {
    bodyParser: false, // 关闭内置body解析
  },
};

export default async function handler(req, res) {
  try {
    const { method, url, headers } = req;
    console.log("url=",url);
    const baseTarget1 = 'http://api.dify.woa.com/v1/info';
    const apiKey = "app-iED3oMZNrWiKtXu5T5ASim2c";
    // 如果是根路径，返回自定义响应
    if (url === '/api/proxy1' || url === '/api/proxy1/') {
      return res.status(200).json({ 
        message: "Hello from Proxy API on EdgeOne Pages 1111111111!" 
      });
    }
    if (url === '/api/proxy') {
      const fetchResponse = await fetch(baseTarget1, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          // 需要的话可携带客户端请求其他头
        },
      });
      return res.status(200).json({
        message: fetchResponse
      });
    }

    // 检查是否是有效的API路径，避免转发到不存在的目标
    const pathWithoutQuery = url.split('?')[0];
    const apiPath = pathWithoutQuery.replace('/api/proxy', '');
    
    // 如果路径为空或只有斜杠，说明是无效路径
    if (!apiPath || apiPath === '/' || apiPath === '') {
        const fetchResponse = await fetch(baseTarget1, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          // 需要的话可携带客户端请求其他头
        },
      });
      const data = await fetchResponse.json();
      return res.status(200).json(data);
      return res.status(404).json({ 
        error: "路径不存在",
        message: `请求的路径 ${url} 不存在于代理服务中`,
        available_paths: [
          "/api/proxy",
          "/api/proxy/info"
        ]
      });
    }

    // 固定转发的域名（结尾不要带 / ）
    const baseTarget = 'http://api.dify.woa.com/v1';

    // 拼接路径和查询参数，形成完整目标URL
    const target = baseTarget + url; // url 包含路径和查询字符串


    if (method === 'GET') {
      // 直接转发 GET 请求
      const fetchResponse = await fetch(target, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          // 需要的话可携带客户端请求其他头
        },
      });

      fetchResponse.headers.forEach((value, key) => {
        if (!['content-encoding', 'transfer-encoding', 'connection', 'content-length'].includes(key.toLowerCase())) {
          res.setHeader(key, value);
        }
      });

      const data = Buffer.from(await fetchResponse.arrayBuffer());
      return res.status(fetchResponse.status).send(data);
    }

    if (method === 'POST') {
      const contentType = headers['content-type'] || '';

      if (contentType.startsWith('multipart/form-data')) {
        const { fields, files } = await parseMultipart(req);
        const form = new FormData();

        for (const key in fields) {
          if (Array.isArray(fields[key])) {
            fields[key].forEach(value => form.append(key, value));
          } else {
            form.append(key, fields[key]);
          }
        }

        for (const key in files) {
          const file = files[key];
          if (Array.isArray(file)) {
            for (const f of file) {
              form.append(key, createReadStream(f.filepath), {
                filename: f.originalFilename,
                contentType: f.mimetype,
              });
            }
          } else {
            form.append(key, createReadStream(file.filepath), {
              filename: file.originalFilename,
              contentType: file.mimetype,
            });
          }
        }

        const fetchResponse = await fetch(target, {
          method: 'POST',
          headers: {
            ...form.getHeaders(),
            Authorization: `Bearer ${apiKey}`,
          },
          body: form,
        });

        fetchResponse.headers.forEach((value, key) => {
          if (!['content-encoding', 'transfer-encoding', 'connection', 'content-length'].includes(key.toLowerCase())) {
            res.setHeader(key, value);
          }
        });

        const data = Buffer.from(await fetchResponse.arrayBuffer());
        return res.status(fetchResponse.status).send(data);

      } else {
        // 普通POST请求不含multipart，直接转发原始body
        const rawBody = await readRawBody(req);

        const fetchResponse = await fetch(target, {
          method: 'POST',
          headers: {
            'Content-Type': contentType,
            Authorization: `Bearer ${apiKey}`,
          },
          body: rawBody,
        });

        fetchResponse.headers.forEach((value, key) => {
          if (!['content-encoding', 'transfer-encoding', 'connection', 'content-length'].includes(key.toLowerCase())) {
            res.setHeader(key, value);
          }
        });

        const data = Buffer.from(await fetchResponse.arrayBuffer());
        return res.status(fetchResponse.status).send(data);
      }
    }

    // 其余方法拒绝
    return res.status(405).json({ error: `不支持 ${method} 请求` });

  } catch (error) {
    console.error('代理错误:', error);
    res.status(500).json({ error: '代理内部错误', details: error.message });
  }
}

// formidable 解析 multipart/form-data
function parseMultipart(req) {
  return new Promise((resolve, reject) => {
    const form = new formidable.IncomingForm();
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
}

// 读取原始请求体
function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const buffers = [];
    req.on('data', (chunk) => buffers.push(chunk));
    req.on('end', () => resolve(Buffer.concat(buffers)));
    req.on('error', reject);
  });
}