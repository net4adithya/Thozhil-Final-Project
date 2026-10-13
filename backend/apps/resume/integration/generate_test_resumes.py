import os

def create_pdf(filename, text):
    # Escape parentheses
    escaped_text = text.replace('(', '\\(').replace(')', '\\)')
    stream_content = f"BT\n/F1 12 Tf\n50 750 Td\n({escaped_text}) Tj\nET"
    stream_bytes = stream_content.encode('latin1')
    
    obj4 = f"<< /Length {len(stream_bytes)} >>\nstream\n"
    obj4_bytes = obj4.encode('latin1') + stream_bytes + b"\nendstream\nendobj\n"
    
    obj1 = b"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"
    obj2 = b"2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n"
    obj3 = b"3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> /Contents 4 0 R >>\nendobj\n"
    
    header = b"%PDF-1.4\n"
    
    offset1 = len(header)
    offset2 = offset1 + len(obj1)
    offset3 = offset2 + len(obj2)
    offset4 = offset3 + len(obj3)
    offset_xref = offset4 + len(obj4_bytes)
    
    xref = f"xref\n0 5\n0000000000 65535 f\n{offset1:010d} 00000 n\n{offset2:010d} 00000 n\n{offset3:010d} 00000 n\n{offset4:010d} 00000 n\ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n{offset_xref}\n%%EOF\n"
    
    pdf_data = header + obj1 + obj2 + obj3 + obj4_bytes + xref.encode('latin1')
    with open(filename, 'wb') as f:
        f.write(pdf_data)

os.makedirs('test_resumes', exist_ok=True)
create_pdf('test_resumes/Rahul_Kumar_Resume.pdf', 'Rahul Kumar. Experience: 3 years Python and FastAPI developer. Skills: SQL, PostgreSQL, Docker, Git.')
create_pdf('test_resumes/Priya_Sharma_Resume.pdf', 'Priya Sharma. Experience: 4 years backend development. Skills: Flask, Python, MySQL, AWS, Git.')
create_pdf('test_resumes/Arjun_Patel_Resume.pdf', 'Arjun Patel. Experience: 1 year scripting. Skills: Python, HTML, CSS, Git.')
print("Test PDFs created successfully in test_resumes/")
