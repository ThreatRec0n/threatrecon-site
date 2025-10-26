import fs from 'fs';
import path from 'path';
import { generateExampleAAR, exportExampleAARAsJSON, exportExampleAARAsMarkdown } from './generateExampleAAR';

/**
 * Generate example AAR files for marketing purposes
 */
async function generateExampleAARFiles() {
  console.log('🎯 Generating example AAR files for marketing...');
  
  try {
    // Generate the AAR data
    const aar = generateExampleAAR();
    
    // Create output directory
    const outputDir = path.join(__dirname, '../../public');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Export as JSON
    const jsonContent = exportExampleAARAsJSON();
    const jsonPath = path.join(outputDir, 'example-aar.json');
    fs.writeFileSync(jsonPath, jsonContent);
    console.log(`✅ JSON AAR generated: ${jsonPath}`);
    
    // Export as Markdown
    const markdownContent = exportExampleAARAsMarkdown();
    const markdownPath = path.join(outputDir, 'example-aar.md');
    fs.writeFileSync(markdownPath, markdownContent);
    console.log(`✅ Markdown AAR generated: ${markdownPath}`);
    
    // Generate PDF (simplified version for now)
    const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 5 0 R
>>
>>
>>
endobj

4 0 obj
<<
/Length 200
>>
stream
BT
/F1 12 Tf
50 750 Td
(ThreatRecon Example After Action Report) Tj
0 -20 Td
(Session ID: example-session-2024-001) Tj
0 -20 Td
(Generated: ${aar.generatedAt}) Tj
0 -20 Td
(Duration: ${aar.session.duration_minutes} minutes) Tj
0 -40 Td
(Overall Score: ${aar.scoring.overall_score}%) Tj
0 -20 Td
(Technical Response: ${aar.scoring.category_scores.technical_response.percentage}%) Tj
0 -20 Td
(Legal & Compliance: ${aar.scoring.category_scores.legal_compliance.percentage}%) Tj
0 -20 Td
(Executive Communication: ${aar.scoring.category_scores.executive_communication.percentage}%) Tj
0 -20 Td
(Business Continuity: ${aar.scoring.category_scores.business_continuity.percentage}%) Tj
0 -40 Td
(Signed Hash: ${(aar.metadata as any).signed_hash || 'N/A'}) Tj
0 -20 Td
(Signing Key ID: ${(aar.metadata as any).signing_key_id || 'N/A'}) Tj
ET
endstream
endobj

5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000274 00000 n 
0000000525 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
600
%%EOF`;
    
    const pdfPath = path.join(outputDir, 'example-aar.pdf');
    fs.writeFileSync(pdfPath, pdfContent);
    console.log(`✅ PDF AAR generated: ${pdfPath}`);
    
    console.log('\n🎉 Example AAR files generated successfully!');
    console.log('📁 Files created:');
    console.log(`   - ${jsonPath}`);
    console.log(`   - ${markdownPath}`);
    console.log(`   - ${pdfPath}`);
    console.log('\n💡 These files can be safely shared publicly as they contain only placeholder data.');
    
  } catch (error) {
    console.error('❌ Error generating example AAR files:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  generateExampleAARFiles();
}

export { generateExampleAARFiles };
