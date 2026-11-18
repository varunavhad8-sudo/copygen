const fs = require('fs');
const AdmZip = require('adm-zip');

function editDocx() {
  const zip = new AdmZip('CopyGen_Legal_Documents_v4.docx');
  const zipEntries = zip.getEntries();
  
  let documentXmlEntry = zipEntries.find(entry => entry.entryName === 'word/document.xml');
  if (!documentXmlEntry) {
    console.error("Could not find word/document.xml");
    return;
  }
  
  let xml = documentXmlEntry.getData().toString('utf8');
  
  // EDIT 1: Remove "Annual subscriptions" bullet point
  const edit1Target = "Annual subscriptions: Eligible for a prorated refund within 7 days of purchase if fewer than 20 generations have been made.";
  const edit1PStart = xml.lastIndexOf('<w:p>', xml.indexOf(edit1Target));
  const edit1PEnd = xml.indexOf('</w:p>', xml.indexOf(edit1Target)) + 6;
  const edit1PFull = xml.substring(edit1PStart, edit1PEnd);
  xml = xml.replace(edit1PFull, '');
  
  // EDIT 2: Add bullet points after "In summary, we use: "
  const edit2Target = "In summary, we use: ";
  const edit2PStart = xml.lastIndexOf('<w:p>', xml.indexOf(edit2Target));
  const edit2PEnd = xml.indexOf('</w:p>', xml.indexOf(edit2Target)) + 6;
  const edit2PFull = xml.substring(edit2PStart, edit2PEnd);
  
  const edit2Replacement = edit2PFull + `
    <w:p><w:pPr><w:spacing w:lineRule="auto"/></w:pPr><w:r><w:t xml:space="preserve">• Authentication cookies (keep you logged in securely)</w:t></w:r></w:p>
    <w:p><w:pPr><w:spacing w:lineRule="auto"/></w:pPr><w:r><w:t xml:space="preserve">• Analytics cookies (understand platform usage anonymously)</w:t></w:r></w:p>
    <w:p><w:pPr><w:spacing w:lineRule="auto"/></w:pPr><w:r><w:t xml:space="preserve">• Functional cookies (remember your preferences and settings)</w:t></w:r></w:p>
    <w:p><w:pPr><w:spacing w:lineRule="auto"/></w:pPr><w:r><w:t xml:space="preserve">• Payment security cookies (secure checkout sessions)</w:t></w:r></w:p>
  `;
  
  xml = xml.replace(edit2PFull, edit2Replacement);
  
  // EDIT 3: Insert Section 12 before Section 13
  const section13Idx = xml.indexOf('13. Grievance Officer (India)');
  const edit3PStart = xml.lastIndexOf('<w:p>', section13Idx);
  const edit3Insertion = `
    <w:p><w:pPr><w:pStyle w:val="Heading2"/><w:spacing w:lineRule="auto"/></w:pPr><w:r><w:t xml:space="preserve">12. Children's Privacy</w:t></w:r></w:p>
    <w:p><w:pPr><w:spacing w:lineRule="auto"/></w:pPr><w:r><w:t xml:space="preserve">The Service is not directed to individuals under the age of 18. We do not knowingly collect personal information from minors. If you become aware that a child has provided us with personal information, contact us immediately at privacy@copygen.in and we will delete it promptly.</w:t></w:r></w:p>
  `;
  xml = xml.substring(0, edit3PStart) + edit3Insertion + xml.substring(edit3PStart);
  
  // EDIT 4: Replace Google Analytics Opt-out sentence
  const edit4Target = "Google Analytics Opt-out Browser Add-on";
  const edit4PStart = xml.lastIndexOf('<w:p>', xml.indexOf(edit4Target));
  const edit4PEnd = xml.indexOf('</w:p>', xml.indexOf(edit4Target)) + 6;
  const edit4PFull = xml.substring(edit4PStart, edit4PEnd);
  
  const edit4ReplacementP = `<w:p><w:pPr><w:spacing w:lineRule="auto"/></w:pPr><w:r><w:t xml:space="preserve">You can opt out of Google Analytics tracking by installing the Google Analytics Opt-out Browser Add-on, available at tools.google.com/dlpage/gaoptout</w:t></w:r></w:p>`;
  xml = xml.replace(edit4PFull, edit4ReplacementP);

  // Write the updated XML back to the zip
  zip.updateFile("word/document.xml", Buffer.from(xml, 'utf8'));
  
  // Save as CopyGen_Legal_Documents_Final.docx
  zip.writeZip("CopyGen_Legal_Documents_Final.docx");
  console.log("Successfully generated CopyGen_Legal_Documents_Final.docx");
}

editDocx();
