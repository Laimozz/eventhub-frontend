import re
import sys

def convert_html_to_jsx(html_file, component_name, out_file):
    with open(html_file, 'r', encoding='utf-8') as f:
        html = f.read()

    # Extract main content (everything inside <body>)
    body_match = re.search(r'<body[^>]*>(.*?)</body>', html, re.DOTALL | re.IGNORECASE)
    if body_match:
        html = body_match.group(1)

    # Remove script tags
    html = re.sub(r'<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>', '', html, flags=re.IGNORECASE)
    # Remove header if it exists because we will use CustomerHeader
    html = re.sub(r'<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>', '', html, flags=re.IGNORECASE)
    # Remove footer if it exists because we will use CustomerFooter
    html = re.sub(r'<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>', '', html, flags=re.IGNORECASE)
    # Remove TicketBox AI Assistant floating widget
    html = re.sub(r'<div class="fixed bottom-space-lg right-space-lg[^>]*>.*?</div>\s*</div>', '', html, flags=re.DOTALL)
    
    # Replace class= with className=
    html = html.replace('class=', 'className=')
    html = html.replace('for=', 'htmlFor=')
    html = html.replace('tabindex=', 'tabIndex=')
    html = html.replace('onclick=', 'onClick=')

    # Self-close img, input, hr, br
    html = re.sub(r'<img([^>]*?)(?<!/)>', r'<img\1 />', html)
    html = re.sub(r'<input([^>]*?)(?<!/)>', r'<input\1 />', html)
    html = re.sub(r'<hr([^>]*?)(?<!/)>', r'<hr\1 />', html)
    html = re.sub(r'<br([^>]*?)(?<!/)>', r'<br\1 />', html)
    
    # Fix inline styles (e.g. style="display: none;") to style={{ display: 'none' }} - mostly ignore or manually fix
    # Here we just blindly replace a specific background-image style seen in the html
    html = re.sub(r'style="background-image:\s*url\(\'(.*?)\'\)"', r'style={{ backgroundImage: "url(\'\1\')" }}', html)

    jsx = f"""import React from 'react';
import {{ CustomerHeader }} from '../components/CustomerHeader';
import {{ CustomerFooter }} from '../components/CustomerFooter';

export function {component_name}() {{
  return (
    <>
      <CustomerHeader user={{null}} onSelectMode={{() => {{}}}} />
      {{/* Main Content */}}
      {html}
      <CustomerFooter />
    </>
  );
}}
"""
    with open(out_file, 'w', encoding='utf-8') as f:
        f.write(jsx)

if __name__ == '__main__':
    convert_html_to_jsx('1.html', 'CustomerEventDetailPage', '../../src/features/customer/pages/CustomerEventDetailPage.tsx')
    convert_html_to_jsx('2.html', 'CustomerEventSearchPage', '../../src/features/customer/pages/CustomerEventSearchPage.tsx')
    convert_html_to_jsx('3.html', 'CustomerHomePage', '../../src/features/customer/pages/CustomerHomePage.tsx')
