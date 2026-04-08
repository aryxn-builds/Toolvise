import { NextResponse } from "next/server"

export async function GET() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="20">
  <linearGradient id="b" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <rect rx="3" width="160" height="20" fill="#555"/>
  <rect rx="3" x="90" width="70" height="20" fill="#2EA043"/>
  <rect rx="3" width="160" height="20" fill="url(#b)"/>
  <g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11">
    <text x="46" y="15" fill="#010101" fill-opacity=".3">built with</text>
    <text x="46" y="14">built with</text>
    <text x="124" y="15" fill="#010101" fill-opacity=".3">Toolvise</text>
    <text x="124" y="14">Toolvise</text>
  </g>
</svg>`

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=86400",
    },
  })
}
