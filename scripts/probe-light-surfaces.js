JSON.stringify((() => {
  const out = [];
  for (const el of document.querySelectorAll('div,section,aside,nav,button,a,table,ul')) {
    const cs = getComputedStyle(el);
    const bgc = cs.backgroundColor;
    let lum = -1;
    const m = bgc.match(/rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/);
    if (m) lum = 0.2126 * +m[1] + 0.7152 * +m[2] + 0.0722 * +m[3];
    const bimg = cs.backgroundImage;
    let imgBright = false;
    if (bimg && bimg !== "none") {
      const hm = bimg.match(/#[0-9a-fA-F]{6}/g) || [];
      for (const hx of hm) {
        const n = [1, 3, 5].map((i) => parseInt(hx.slice(i, i + 2), 16));
        if (0.2126 * n[0] + 0.7152 * n[1] + 0.0722 * n[2] > 185) imgBright = true;
      }
      const rm = bimg.match(/rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/);
      if (rm && 0.2126 * +rm[1] + 0.7152 * +rm[2] + 0.0722 * +rm[3] > 185) imgBright = true;
    }
    const rect = el.getBoundingClientRect();
    if ((lum > 185 || imgBright) && rect.width > 40 && rect.height > 30 && rect.width * rect.height < 390 * 844 * 0.9) {
      out.push({
        cls: (typeof el.className === "string" ? el.className.split(" ")[0] : el.tagName).slice(0, 44),
        bg: bgc.slice(0, 28),
        img: imgBright ? bimg.slice(0, 56) : "",
        w: Math.round(rect.width),
        h: Math.round(rect.height),
        y: Math.round(rect.top),
      });
    }
  }
  return out.slice(0, 20);
})())
