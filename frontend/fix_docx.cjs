const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

async function buildDocx() {
  const zip = new JSZip();
  const dirPath = './temp_docx';

  // Helper to recursively add files to JSZip
  function addFiles(dir, zipFolder) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      if (fs.statSync(fullPath).isDirectory()) {
        addFiles(fullPath, zipFolder.folder(file));
      } else {
        const content = fs.readFileSync(fullPath);
        zipFolder.file(file, content);
      }
    }
  }

  // First, modify document.xml
  const docPath = path.join(dirPath, 'word', 'document.xml');
  let xml = fs.readFileSync(docPath, 'utf8');

  // EDIT 1: Remove "Annual subscriptions" bullet point
  const edit1Target = "Annual subscriptions: Eligible for a prorated refund within 7 days of purchase if fewer than 20 generations have been made.";
  const edit1PStart = xml.lastIndexOf('<w:p>', xml.indexOf(edit1Target));
  const edit1PEnd = xml.indexOf('</w:p>', xml.indexOf(edit1Target)) + 6;
  if (edit1PStart !== -1 && edit1PEnd > 5) {
    const edit1PFull = xml.substring(edit1PStart, edit1PEnd);
    xml = xml.replace(edit1PFull, '');
  }

  // EDIT 2: Add bullet points after "In summary, we use: "
  const edit2Target = "In summary, we use: ";
  const edit2PStart = xml.lastIndexOf('<w:p>', xml.indexOf(edit2Target));
  const edit2PEnd = xml.indexOf('</w:p>', xml.indexOf(edit2Target)) + 6;
  if (edit2PStart !== -1 && edit2PEnd > 5) {
    const edit2PFull = xml.substring(edit2PStart, edit2PEnd);
    const edit2Replacement = edit2PFull + `
      <w:p><w:pPr><w:spacing w:lineRule="auto"/></w:pPr><w:r><w:t xml:space="preserve">• Authentication cookies (keep you logged in securely)</w:t></w:r></w:p>
      <w:p><w:pPr><w:spacing w:lineRule="auto"/></w:pPr><w:r><w:t xml:space="preserve">• Analytics cookies (understand platform usage anonymously)</w:t></w:r></w:p>
      <w:p><w:pPr><w:spacing w:lineRule="auto"/></w:pPr><w:r><w:t xml:space="preserve">• Functional cookies (remember your preferences and settings)</w:t></w:r></w:p>
      <w:p><w:pPr><w:spacing w:lineRule="auto"/></w:pPr><w:r><w:t xml:space="preserve">• Payment security cookies (secure checkout sessions)</w:t></w:r></w:p>
    `;
    xml = xml.replace(edit2PFull, edit2Replacement);
  }

  // EDIT 3: Insert Section 12 before Section 13
  const section13Idx = xml.indexOf('13. Grievance Officer (India)');
  if (section13Idx !== -1) {
    const edit3PStart = xml.lastIndexOf('<w:p>', section13Idx);
    const edit3Insertion = `
      <w:p><w:pPr><w:pStyle w:val="Heading2"/><w:spacing w:lineRule="auto"/></w:pPr><w:r><w:t xml:space="preserve">12. Children's Privacy</w:t></w:r></w:p>
      <w:p><w:pPr><w:spacing w:lineRule="auto"/></w:pPr><w:r><w:t xml:space="preserve">The Service is not directed to individuals under the age of 18. We do not knowingly collect personal information from minors. If you become aware that a child has provided us with personal information, contact us immediately at privacy@copygen.in and we will delete it promptly.</w:t></w:r></w:p>
    `;
    xml = xml.substring(0, edit3PStart) + edit3Insertion + xml.substring(edit3PStart);
  }

  // EDIT 4: Replace Google Analytics Opt-out sentence
  const edit4Target = "Google Analytics Opt-out Browser Add-on";
  const edit4PStart = xml.lastIndexOf('<w:p>', xml.indexOf(edit4Target));
  const edit4PEnd = xml.indexOf('</w:p>', xml.indexOf(edit4Target)) + 6;
  if (edit4PStart !== -1 && edit4PEnd > 5) {
    const edit4PFull = xml.substring(edit4PStart, edit4PEnd);
    const edit4ReplacementP = `<w:p><w:pPr><w:spacing w:lineRule="auto"/></w:pPr><w:r><w:t xml:space="preserve">You can opt out of Google Analytics tracking by installing the Google Analytics Opt-out Browser Add-on, available at tools.google.com/dlpage/gaoptout</w:t></w:r></w:p>`;
    xml = xml.replace(edit4PFull, edit4ReplacementP);
  }

  // Save the modified xml back to temp_docx
  fs.writeFileSync(docPath, xml);

  // Add all files to JSZip
  addFiles(dirPath, zip);

  // Generate docx
  const content = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  });

  fs.writeFileSync('CopyGen_Legal_Documents_Final.docx', content);
  console.log('Successfully written via JSZip');
}

buildDocx().catch(console.error);
