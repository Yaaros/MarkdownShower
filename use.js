const {marked} = require('marked');
const fs = require('fs');

// Set options
marked.use({
  async: false,
  pedantic: false,
  gfm: true,
});
// 读取 Markdown 文件
const markdownContent = fs.readFileSync('2022数据库期中个人答卷.md', 'utf8');

// 使用 marked 将 Markdown 转换为 HTML
const htmlContent = marked(markdownContent);

// 创建一个简单的 HTML 模板来包含转换后的 HTML
const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Markdown in HTML</title>
</head>
<body>
${htmlContent}
</body>
</html>
`;

// 将完整的 HTML 写入文件
fs.writeFileSync('2022数据库期中个人答卷.html', htmlTemplate);