const fs = require('fs');
const HTMLtoDOCX = require('html-to-docx');

async function generate() {
  const termsContent = fs.readFileSync('./src/pages/Terms.jsx', 'utf8');
  const privacyContent = fs.readFileSync('./src/pages/Privacy.jsx', 'utf8');
  const refundContent = fs.readFileSync('./src/pages/RefundPolicy.jsx', 'utf8');
  const cookieContent = fs.readFileSync('./src/pages/CookiePolicy.jsx', 'utf8');

  let fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>CopyGen Legal Documents</title></head><body style="font-family: Arial, sans-serif;">`;
  
  fullHtml += `<h1>CopyGen Legal Policies</h1>`;
  fullHtml += `<p><strong>Last Updated: April 23, 2026</strong></p>`;
  fullHtml += `<hr/>`;

  // Function to parse the simple structure
  const parseSections = (content, title) => {
    let html = `<h2>${title}</h2>`;
    const sectionRegex = /title:\s*'([^']+)',\s*content:\s*`([\s\S]*?)`/g;
    let match;
    while ((match = sectionRegex.exec(content)) !== null) {
      html += `<h3>${match[1]}</h3>`;
      const paras = match[2].split('\n\n');
      for(let p of paras) {
        if (p.trim() === '') continue;
        let pHtml = p.trim().replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        pHtml = pHtml.replace(/^- (.*)/gm, '<li>$1</li>');
        if (pHtml.includes('<li>')) {
          html += `<ul>${pHtml}</ul>`;
        } else {
          html += `<p>${pHtml}</p>`;
        }
      }
    }
    return html;
  };

  // Terms and Privacy use the sections array structure
  fullHtml += parseSections(termsContent, 'Terms of Service');
  fullHtml += `<br/><hr/><br/>`;
  fullHtml += parseSections(privacyContent, 'Privacy Policy');
  fullHtml += `<br/><hr/><br/>`;

  // Refund and Cookie use direct JSX
  const parseJSX = (content, title) => {
    let html = `<h2>${title}</h2>`;
    const sectionMatches = [...content.matchAll(/<section[^>]*>([\s\S]*?)<\/section>/g)];
    for(let match of sectionMatches) {
      const sectionContent = match[1];
      const titleMatch = sectionContent.match(/<h2[^>]*>(.*?)<\/h2>/);
      if (titleMatch) {
        html += `<h3>${titleMatch[1].replace(/<[^>]*>?/gm, '')}</h3>`;
      }
      
      const parts = sectionContent.split(/(<ul[\s\S]*?<\/ul>|<p[\s\S]*?<\/p>)/g);
      for(let part of parts) {
        if(part.startsWith('<p')) {
          html += `<p>${part.replace(/<[^>]*>?/gm, '')}</p>`;
        } else if (part.startsWith('<ul')) {
          const liMatches = [...part.matchAll(/<li.*?>(.*?)<\/li>/g)];
          if (liMatches.length > 0) {
            html += `<ul>`;
            for(let li of liMatches) {
              html += `<li>${li[1].replace(/<[^>]*>?/gm, '')}</li>`;
            }
            html += `</ul>`;
          }
        }
      }
    }
    return html;
  };

  fullHtml += parseJSX(refundContent, 'Refund Policy');
  fullHtml += `<br/><hr/><br/>`;
  fullHtml += parseJSX(cookieContent, 'Cookie Policy');

  fullHtml += `</body></html>`;

  const buffer = await HTMLtoDOCX(fullHtml, null, {
    table: { row: { cantSplit: true } },
    footer: true,
    pageNumber: true,
  });

  fs.writeFileSync('CopyGen_Legal_Documents_Final.docx', buffer);
  console.log('Successfully generated CopyGen_Legal_Documents_Final.docx');
}

generate().catch(console.error);
