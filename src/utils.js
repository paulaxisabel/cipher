// ── PHP 5.6 Reserved Words (labels must not collide) ─────────────────────
const PHP_RESERVED = new Set([
  'abstract','and','array','as','break','callable','case','catch','class',
  'clone','const','continue','declare','default','die','do','echo','else',
  'elseif','empty','enddeclare','endfor','endforeach','endif','endswitch',
  'endwhile','eval','exit','extends','final','finally','for','foreach',
  'function','global','goto','if','implements','include','include_once',
  'instanceof','insteadof','interface','isset','list','namespace','new',
  'or','print','private','protected','public','require','require_once',
  'return','static','switch','throw','trait','try','unset','use','var',
  'while','xor','yield','true','false','null',
  'db','main','default','master','app','bir',
])

// ── Encoding helpers ──────────────────────────────────────────────────────

export function b64e(s) {
  return btoa(unescape(encodeURIComponent(s)))
}

export function b64d(s) {
  return decodeURIComponent(escape(atob(s)))
}

export function toHex(s) {
  return s
    .split('')
    .map((c) => '\\x' + c.charCodeAt(0).toString(16).padStart(2, '0'))
    .join('')
}

export function rot13(s) {
  return s.replace(/[a-zA-Z]/g, (c) => {
    const base = c <= 'Z' ? 65 : 97
    return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base)
  })
}

export function xorEnc(str) {
  const key = 'obs_' + Math.random().toString(36).slice(2, 6)
  let out = ''
  for (let i = 0; i < str.length; i++) {
    out += String.fromCharCode(str.charCodeAt(i) ^ key.charCodeAt(i % key.length))
  }
  return { enc: b64e(out), key }
}

// ── Octal string encoder ──────────────────────────────────────────────────

function phpOctalEncode(str) {
  return '"' + str.split('').map(c => '\\' + c.charCodeAt(0).toString(8).padStart(3, '0')).join('') + '"'
}

// ── Goto label generator ──────────────────────────────────────────────────

function randLabel() {
  const lower = 'abcdefghijklmnopqrstuvwxyz'
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let label
  do {
    label = lower[Math.floor(Math.random() * lower.length)]
    for (let i = 0; i < 7; i++) {
      label += chars[Math.floor(Math.random() * chars.length)]
    }
  } while (PHP_RESERVED.has(label.toLowerCase()))
  return label
}

// ── Goto obfuscator ───────────────────────────────────────────────────────

export function gotoObfuscate(rawCode) {
  let code = rawCode.replace(/^<\?php\s*/i, '').replace(/\?>\s*$/, '').trim()

  code = code
    .replace(/\/\/[^\n]*/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/#[^\n]*/g, '')

  const stmts = code
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0)

  function encodeStrings(stmt) {
    return stmt.replace(/(["'])([^"']*)\1/g, (_match, _q, inner) => {
      if (inner === '') return '""'
      return phpOctalEncode(inner)
    })
  }

  const processed = stmts
    .map(stmt => {
      if (/defined\s*\(/.test(stmt) && /BASEPATH|BASE_PATH/.test(stmt)) {
        return (
          `if(!defined(${phpOctalEncode('BASEPATH')}))` +
          `die(${phpOctalEncode('No direct script access allowed')})`
        )
      }
      if (/^exit\s*\(|^die\s*\(/.test(stmt)) return null
      return encodeStrings(stmt)
    })
    .filter(s => s !== null)

  const usedLabels = new Set()
  const labels = processed.map(() => {
    let lbl
    do { lbl = randLabel() } while (usedLabels.has(lbl))
    usedLabels.add(lbl)
    return lbl
  })

  const blocks = processed.map((stmt, i) => {
    const next = i < processed.length - 1 ? ` goto ${labels[i + 1]};` : ''
    return { label: labels[i], code: `${labels[i]}: ${stmt};${next}` }
  })

  const entryLabel = labels[0]

  const shuffled = [...blocks]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }

  const body = shuffled.map(b => b.code).join('\n')
  return `<?php\ngoto ${entryLabel};\n${body}`
}

// ── Goto decoder ──────────────────────────────────────────────────────────

export function gotoDecodeCI(rawCode) {
  let s = rawCode.replace(/^<\?php\s*/i, '').replace(/\?>\s*$/, '').trim()

  function decodeEscapes(str) {
    return str
      .replace(/\\([0-7]{1,3})/g, (_, o) => String.fromCharCode(parseInt(o, 8)))
      .replace(/\\x([0-9a-fA-F]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
  }

  const entryMatch = s.match(/^goto\s+([A-Za-z_][A-Za-z0-9_]*)\s*;/)
  if (!entryMatch) return rawCode
  const entryLabel = entryMatch[1]

  const knownLabels = new Set([entryLabel])
  const gotoScan = /\bgoto\s+([A-Za-z_][A-Za-z0-9_]*)\s*;/g
  let gm
  while ((gm = gotoScan.exec(s)) !== null) knownLabels.add(gm[1])

  if (knownLabels.size === 0) return rawCode

  const body = s.replace(/^goto\s+[A-Za-z_][A-Za-z0-9_]*\s*;\s*/, '')
  const labelAlt = [...knownLabels]
    .map(l => l.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|')
  const splitter = new RegExp(`\\b(${labelAlt}):\\s*`)
  const parts = body.split(splitter).filter(p => p !== '')

  const blockMap = new Map()
  for (let i = 0; i < parts.length - 1; i += 2) {
    const label = parts[i]
    if (!knownLabels.has(label)) continue
    let content = parts[i + 1].trim()

    const gotoMatch = content.match(/\bgoto\s+([A-Za-z_][A-Za-z0-9_]*)\s*;\s*$/)
    let next = null
    if (gotoMatch) {
      next = gotoMatch[1]
      content = content.slice(0, gotoMatch.index).trim()
    }
    content = content.replace(/;\s*$/, '').trim()
    blockMap.set(label, { stmt: content, next })
  }

  let current = entryLabel
  const stmts = []
  const visited = new Set()
  while (current && blockMap.has(current) && !visited.has(current)) {
    visited.add(current)
    const { stmt, next } = blockMap.get(current)
    if (stmt) stmts.push(stmt)
    current = next
  }

  const decoded = stmts.map(stmt =>
    stmt.replace(/"([^"]*)"/g, (_, inner) => "'" + decodeEscapes(inner) + "'")
  )

  const clean = decoded
    .filter(stmt => !/^\$_n\s*=/.test(stmt.trim()))
    .filter(stmt => !/^\$_x\s*=/.test(stmt.trim()))
    .filter(stmt => !/^\$_a\s*=/.test(stmt.trim()))
    .filter(stmt => !/^if\s*\(false\)/.test(stmt.trim()))

  const rejoined = clean.join(';\n') + ';'
  const withTag = '<?php\n' + rejoined

  return /\$db\s*\[/.test(withTag) ? formatCIConfig(withTag) : withTag
}

// ── Pre-processing ────────────────────────────────────────────────────────

export function stripComments(c) {
  return c
    .replace(/\/\/[^\n]*/g, '')
    .replace(/#[^\n]*/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
}

export function renameVars(c) {
  const skip = new Set([
    '$_GET', '$_POST', '$_SERVER', '$_SESSION', '$_COOKIE',
    '$_FILES', '$_ENV', '$_REQUEST', '$this', '$GLOBALS',
    '$db', '$active_group', '$active_record',
    '$_n', '$_x', '$_a', '$_k', '$_d', '$_r', '$_i', '$_h',
  ])
  const map = new Map()
  let n = 0
  return c.replace(/\$([a-zA-Z_][a-zA-Z0-9_]*)/g, (m, v) => {
    if (skip.has(m)) return m
    if (!map.has(v)) map.set(v, '_v' + (n++).toString(16).padStart(3, '0'))
    return '$' + map.get(v)
  })
}

export function junkLine() {
  const j = [
    `$_n=md5(uniqid())`,
    `$_n=sha1(uniqid())`,
    `$_n=crc32(uniqid())`,
    `$_n=abs(rand())`,
    `$_n=round(microtime(1))`,
  ]
  return j[Math.floor(Math.random() * j.length)]
}

// ── Obfuscate ─────────────────────────────────────────────────────────────

export function obfuscate(rawCode, method, opts) {
  let code = rawCode.trim()
  if (opts.strip)  code = stripComments(code)
  if (opts.rename) code = renameVars(code)

  let inner = code.replace(/^<\?php\s*/i, '').replace(/\?>\s*$/, '').trim()

  let result = ''

  if (method === 'base64') {
    const payload = opts.junk ? `${junkLine()};\n${inner}` : inner
    result = `<?php eval(base64_decode('${b64e(payload)}'));`

  } else if (method === 'xor') {
    const payload = opts.junk ? `${junkLine()};\n${inner}` : inner
    const { enc, key } = xorEnc(payload)
    result =
      `<?php\n` +
      `$_k=base64_decode('${b64e(key)}');\n` +
      `$_d=base64_decode('${enc}');\n` +
      `$_r='';\n` +
      `for($_i=0;$_i<strlen($_d);$_i++){\n` +
      `  $_r.=chr(ord($_d[$_i])^ord($_k[$_i%strlen($_k)]));\n` +
      `}\n` +
      `eval($_r);`

  } else if (method === 'hex') {
    const payload = opts.junk ? `${junkLine()};\n${inner}` : inner
    result = `<?php $_h=base64_decode('${b64e(toHex(payload))}'); eval(stripcslashes($_h));`

  } else if (method === 'rot13') {
    const payload = opts.junk ? `${junkLine()};\n${inner}` : inner
    result = `<?php eval(str_rot13(base64_decode('${b64e(rot13(payload))}')));`

  } else if (method === 'gzip') {
    const payload = opts.junk ? `${junkLine()};\n${inner}` : inner
    result = `<?php eval(base64_decode(base64_decode('${b64e(b64e(payload))}'))); `

  } else if (method === 'multi') {
    const payload = opts.junk ? `${junkLine()};\n${inner}` : inner
    const l1 = b64e(payload)
    const { enc, key } = xorEnc(l1)
    const layer =
      `$_k=base64_decode('${b64e(key)}');` +
      `$_d=base64_decode('${enc}');` +
      `$_r='';` +
      `for($_i=0;$_i<strlen($_d);$_i++){` +
        `$_r.=chr(ord($_d[$_i])^ord($_k[$_i%strlen($_k)]));` +
      `}` +
      `eval(base64_decode($_r));`
    result = `<?php eval(base64_decode('${b64e(layer)}'));`

  } else if (method === 'goto') {
    result = gotoObfuscate('<?php\n' + inner)
  }

  if (opts.shuf && method !== 'goto') {
    result = result.replace(/^<\?php\s*/, `<?php $_a=array('${b64e('a')}','${b64e('b')}');\n`)
  }

  return result
}

// ── Format helpers ────────────────────────────────────────────────────────

function formatMinified(s) {
  s = s.replace(/([^\s=!<>])=([^\s>=])/g, '$1 = $2')
  const stmts = s.split(';').map(l => l.trim()).filter(l => l.length > 0)
  let out = stmts.join(';\n') + ';'
  out = out.replace(/(.*\['stricton'\]\s*=\s*[^;\n]+;\n)(\$)/g, '$1\n$2')
  out = out.replace(/\n{3,}/g, '\n\n').trim()
  return out
}

function cleanFormatted(s) {
  s = s.replace(/([^\s=!<>])=([^\s>=])/g, '$1 = $2')
  s = s.replace(/\n{3,}/g, '\n\n')
  return s.trim()
}

// ── CI config pretty-printer ──────────────────────────────────────────────

function formatCIConfig(raw) {
  let s = raw.replace(/^<\?php\s*/i, '').replace(/\?>\s*$/, '').trim()
  s = s.replace(/\/\*[\s\S]*?\*\//g, '').trim()

  const stmts = s
    .split(';')
    .map(l => l.trim())
    .filter(l => l.length > 0)
    .filter(l => !l.startsWith('#'))

  const lines = []
  let lastGroup = null
  let firstGroup = true

  for (const stmt of stmts) {
    if (
      /if\s*\(\s*!\s*defined\s*\(/.test(stmt) ||
      /^exit\s*\(/.test(stmt) ||
      /^die\s*\(/.test(stmt)
    ) continue

    const groupMatch = stmt.match(/^\$db\s*\[\s*['"]([^'"]+)['"]\s*\]/)
    if (groupMatch) {
      const group = groupMatch[1]
      if (group !== lastGroup) {
        if (!firstGroup) {
          lines.push('')
          lines.push('##################################################')
        }
        firstGroup = false
        lastGroup = group
      }
      lines.push(stmt + ';')
    } else {
      lines.push(stmt + ';')
    }
  }

  const header = `<?php  if ( ! defined('BASEPATH')) exit('No direct script access allowed');`
  return (
    header + '\n' +
    lines.join('\n') +
    '\n\n/* End of file database.php */\n' +
    '/* Location: ./application/config/database.php */'
  )
}

// ── Decode ────────────────────────────────────────────────────────────────

export function decode(rawCode) {
  let s = rawCode.replace(/^<\?php\s*/i, '').replace(/\?>\s*$/, '').trim()

  if (/^goto\s+[A-Za-z_][A-Za-z0-9_]*\s*;/.test(s)) {
    return gotoDecodeCI(rawCode)
  }

  const isEvalWrapped = /^eval\s*\(/.test(s)

  if (!isEvalWrapped) {
    const hasInline = /base64_decode\s*\(\s*'([A-Za-z0-9+/=]+)'\s*\)/.test(s)
    if (hasInline) {
      s = s.replace(/base64_decode\s*\(\s*'([A-Za-z0-9+/=]+)'\s*\)/g, (match, b64) => {
        try {
          const decoded = b64d(b64)
          if (!decoded.includes('\n') && !decoded.includes('eval(') && !decoded.includes('<?php')) {
            return "'" + decoded + "'"
          }
        } catch (_e) {}
        return match
      })

      if (!s.includes('eval(')) {
        if (/\$db\s*\[/.test(s)) return formatCIConfig(s)
        s = s.includes('\n') ? cleanFormatted(s) : formatMinified(s)
        if (!s.startsWith('<?')) s = '<?php\n' + s
        return s
      }
    }
  }

  for (let i = 0; i < 8; i++) {
    const m1 = s.match(/eval\s*\(\s*base64_decode\s*\(\s*['"]([A-Za-z0-9+/=]+)['"]\s*\)\s*\)/)
    if (m1) { try { s = b64d(m1[1]); continue } catch (_e) {} }

    const m3 = s.match(/eval\s*\(\s*str_rot13\s*\(\s*base64_decode\s*\(\s*['"]([A-Za-z0-9+/=]+)['"]\s*\)\s*\)\s*\)/)
    if (m3) { try { s = rot13(b64d(m3[1])); continue } catch (_e) {} }

    const m5 = s.match(/eval\s*\(\s*base64_decode\s*\(\s*base64_decode\s*\(\s*['"]([A-Za-z0-9+/=]+)['"]\s*\)\s*\)\s*\)/)
    if (m5) { try { s = b64d(b64d(m5[1])); continue } catch (_e) {} }

    const m4 = s.match(/\$_k\s*=\s*base64_decode\s*\(\s*['"]([A-Za-z0-9+/=]+)['"]\s*\)[\s\S]*?\$_d\s*=\s*base64_decode\s*\(\s*['"]([A-Za-z0-9+/=]+)['"]\s*\)/)
    if (m4) {
      try {
        const k = b64d(m4[1]), d = b64d(m4[2])
        let r = ''
        for (let j = 0; j < d.length; j++) r += String.fromCharCode(d.charCodeAt(j) ^ k.charCodeAt(j % k.length))
        s = r; continue
      } catch (_e) {}
    }

    const m6 = s.match(/\$_h\s*=\s*base64_decode\s*\(\s*['"]([A-Za-z0-9+/=]+)['"]\s*\)/)
    if (m6) {
      try {
        s = b64d(m6[1]).replace(/\\x([0-9a-fA-F]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
        continue
      } catch (_e) {}
    }

    if (/^[A-Za-z0-9+/=]{20,}$/.test(s.trim())) {
      try {
        const d = b64d(s.trim())
        if (d.includes('eval') || d.includes('<?') || d.includes('function')) { s = d; continue }
      } catch (_e) {}
    }

    break
  }

  s = s.replace(/base64_decode\s*\(\s*'([A-Za-z0-9+/=]+)'\s*\)/g, (match, b64) => {
    try {
      const decoded = b64d(b64)
      if (!decoded.includes('\n') && !decoded.includes('eval(') && !decoded.includes('<?php')) {
        return "'" + decoded + "'"
      }
    } catch (_e) {}
    return match
  })

  if (/\$_v[0-9a-f]{3}/.test(s)) {
    const ids = []
    for (const m of s.matchAll(/\$(_v[0-9a-f]{3})/g)) {
      if (!ids.includes(m[1])) ids.push(m[1])
    }
    if (ids.length >= 3) {
      s = s.replaceAll('$' + ids[0], '$active_group')
      s = s.replaceAll('$' + ids[1], '$active_record')
      s = s.replaceAll('$' + ids[2], '$db')
    }
  }

  s = s.replace(/\$_n\s*=[^;]+;\n?/g, '')
  s = s.replace(/\$_x\s*=[^;]+;\n?/g, '')
  s = s.replace(/\$_a\s*=[^;]+;\n?/g, '')
  s = s.replace(/if\s*\(false\)\s*\{[^}]*\}/g, '')
  s = s.replace(/\n{3,}/g, '\n\n').trim()

  if (/\$db\s*\[/.test(s)) return formatCIConfig(s)

  s = s.includes('\n') ? cleanFormatted(s) : formatMinified(s)
  s = s.replace(/\n{3,}/g, '\n\n').trim()
  if (!s.startsWith('<?')) s = '<?php\n' + s
  return s
}

// ── Analyze layers ────────────────────────────────────────────────────────

export function analyzeLayers(code) {
  if (!code.trim()) return []
  const checks = [
    [/base64_decode/i,                                        'base64'],
    [/str_rot13/i,                                           'rot13'],
    [/stripcslashes|\\x[0-9a-f]/i,                          'hex'],
    [/\$_k[\s\S]*\$_d[\s\S]*strlen/,                        'xor'],
    [(code.match(/base64_decode/g) || []).length > 1,        'multi-layer'],
    [/eval\s*\(/i,                                           'eval()'],
    [/\$_n=md5|if\(false\)/,                                 'junk code'],
    [/goto\s+[A-Za-z_][A-Za-z0-9_]*\s*;/i,                 'goto'],
    [/\\[0-7]{3}/,                                           'octal strings'],
  ]
  return checks
    .filter(([test]) => (typeof test === 'boolean' ? test : test.test(code)))
    .map(([, name]) => name)
}

// ── Strength ──────────────────────────────────────────────────────────────

export function strengthScore(method, opts) {
  const base = { base64: 30, xor: 45, hex: 35, rot13: 20, gzip: 48, multi: 82, goto: 70 }
  let score = base[method] ?? 30
  if (opts.strip)  score += 5
  if (opts.rename) score += 15
  if (opts.junk)   score += 12
  if (opts.shuf)   score += 8
  return Math.min(score, 100)
}

export function strengthLabel(score) {
  if (score < 35) return { label: 'Weak',    color: '#e06060' }
  if (score < 60) return { label: 'Medium',  color: 'var(--accent)' }
  if (score < 80) return { label: 'Strong',  color: 'var(--accent)' }
  return              { label: 'Maximum', color: '#5bd49e' }
}

// ── MD5 ───────────────────────────────────────────────────────────────────
export function md5(str) {
  function safeAdd(x, y) {
    const lsw = (x & 0xffff) + (y & 0xffff)
    const msw = (x >> 16) + (y >> 16) + (lsw >> 16)
    return (msw << 16) | (lsw & 0xffff)
  }
  function bitRotateLeft(num, cnt) { return (num << cnt) | (num >>> (32 - cnt)) }
  function md5cmn(q, a, b, x, s, t) { return safeAdd(bitRotateLeft(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b) }
  function md5ff(a, b, c, d, x, s, t) { return md5cmn((b & c) | (~b & d), a, b, x, s, t) }
  function md5gg(a, b, c, d, x, s, t) { return md5cmn((b & d) | (c & ~d), a, b, x, s, t) }
  function md5hh(a, b, c, d, x, s, t) { return md5cmn(b ^ c ^ d, a, b, x, s, t) }
  function md5ii(a, b, c, d, x, s, t) { return md5cmn(c ^ (b | ~d), a, b, x, s, t) }
  function md5blks(s) {
    const md5blk = []
    for (let i = 0; i < 64; i += 4) md5blk[i >> 2] = s.charCodeAt(i) + (s.charCodeAt(i+1) << 8) + (s.charCodeAt(i+2) << 16) + (s.charCodeAt(i+3) << 24)
    return md5blk
  }
  const s2 = unescape(encodeURIComponent(str))
  const length8 = s2.length
  const blks = []
  for (let i = 0; i < length8 + 8; i += 64) blks.push(md5blks(s2.slice(i) + '\0'.repeat(64)))
  blks[Math.floor(length8 / 64)][Math.floor(length8 / 4) & 15] |= 0x80 << (length8 % 4 * 8)
  blks[blks.length - 1][14] = length8 * 8
  let a=1732584193, b=-271733879, c=-1732584194, d=271733878
  for (const x of blks) {
    const [oa, ob, oc, od] = [a, b, c, d]
    a=md5ff(a,b,c,d,x[0],7,-680876936);d=md5ff(d,a,b,c,x[1],12,-389564586);c=md5ff(c,d,a,b,x[2],17,606105819);b=md5ff(b,c,d,a,x[3],22,-1044525330)
    a=md5ff(a,b,c,d,x[4],7,-176418897);d=md5ff(d,a,b,c,x[5],12,1200080426);c=md5ff(c,d,a,b,x[6],17,-1473231341);b=md5ff(b,c,d,a,x[7],22,-45705983)
    a=md5ff(a,b,c,d,x[8],7,1770035416);d=md5ff(d,a,b,c,x[9],12,-1958414417);c=md5ff(c,d,a,b,x[10],17,-42063);b=md5ff(b,c,d,a,x[11],22,-1990404162)
    a=md5ff(a,b,c,d,x[12],7,1804603682);d=md5ff(d,a,b,c,x[13],12,-40341101);c=md5ff(c,d,a,b,x[14],17,-1502002290);b=md5ff(b,c,d,a,x[15],22,1236535329)
    a=md5gg(a,b,c,d,x[1],5,-165796510);d=md5gg(d,a,b,c,x[6],9,-1069501632);c=md5gg(c,d,a,b,x[11],14,643717713);b=md5gg(b,c,d,a,x[0],20,-373897302)
    a=md5gg(a,b,c,d,x[5],5,-701558691);d=md5gg(d,a,b,c,x[10],9,38016083);c=md5gg(c,d,a,b,x[15],14,-660478335);b=md5gg(b,c,d,a,x[4],20,-405537848)
    a=md5gg(a,b,c,d,x[9],5,568446438);d=md5gg(d,a,b,c,x[14],9,-1019803690);c=md5gg(c,d,a,b,x[3],14,-187363961);b=md5gg(b,c,d,a,x[8],20,1163531501)
    a=md5gg(a,b,c,d,x[13],5,-1444681467);d=md5gg(d,a,b,c,x[2],9,-51403784);c=md5gg(c,d,a,b,x[7],14,1735328473);b=md5gg(b,c,d,a,x[12],20,-1926607734)
    a=md5hh(a,b,c,d,x[5],4,-378558);d=md5hh(d,a,b,c,x[8],11,-2022574463);c=md5hh(c,d,a,b,x[11],16,1839030562);b=md5hh(b,c,d,a,x[14],23,-35309556)
    a=md5hh(a,b,c,d,x[1],4,-1530992060);d=md5hh(d,a,b,c,x[4],11,1272893353);c=md5hh(c,d,a,b,x[7],16,-155497632);b=md5hh(b,c,d,a,x[10],23,-1094730640)
    a=md5hh(a,b,c,d,x[13],4,681279174);d=md5hh(d,a,b,c,x[0],11,-358537222);c=md5hh(c,d,a,b,x[3],16,-722521979);b=md5hh(b,c,d,a,x[6],23,76029189)
    a=md5hh(a,b,c,d,x[9],4,-640364487);d=md5hh(d,a,b,c,x[12],11,-421815835);c=md5hh(c,d,a,b,x[15],16,530742520);b=md5hh(b,c,d,a,x[2],23,-995338651)
    a=md5ii(a,b,c,d,x[0],6,-198630844);d=md5ii(d,a,b,c,x[7],10,1126891415);c=md5ii(c,d,a,b,x[14],15,-1416354905);b=md5ii(b,c,d,a,x[5],21,-57434055)
    a=md5ii(a,b,c,d,x[12],6,1700485571);d=md5ii(d,a,b,c,x[3],10,-1894986606);c=md5ii(c,d,a,b,x[10],15,-1051523);b=md5ii(b,c,d,a,x[1],21,-2054922799)
    a=md5ii(a,b,c,d,x[8],6,1873313359);d=md5ii(d,a,b,c,x[15],10,-30611744);c=md5ii(c,d,a,b,x[6],15,-1560198380);b=md5ii(b,c,d,a,x[13],21,1309151649)
    a=md5ii(a,b,c,d,x[4],6,-145523070);d=md5ii(d,a,b,c,x[11],10,-1120210379);c=md5ii(c,d,a,b,x[2],15,718787259);b=md5ii(b,c,d,a,x[9],21,-343485551)
    a=safeAdd(a,oa);b=safeAdd(b,ob);c=safeAdd(c,oc);d=safeAdd(d,od)
  }
  return [a,b,c,d].map(n => ('0'.repeat(8) + (n < 0 ? n + 0x100000000 : n).toString(16)).slice(-8).match(/../g).reverse().join('')).join('')
}

// ── Date / strtotime ──────────────────────────────────────────────────────
export function strtotime(str) {
  if (!str.trim()) return null
  if (/^\d+$/.test(str.trim())) return parseInt(str.trim())
  const d = new Date(str)
  if (isNaN(d.getTime())) return null
  return Math.floor(d.getTime() / 1000)
}

export function timestampToDate(ts, format = 'human') {
  const n = parseInt(ts)
  if (isNaN(n)) return null
  const d = new Date(n * 1000)
  if (format === 'iso')   return d.toISOString()
  if (format === 'local') return d.toLocaleString()
  return d.toUTCString()
}

export function formatDate(dateStr, format) {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return null
  const pad = (n) => String(n).padStart(2, '0')
  const Y = d.getFullYear()
  const m = pad(d.getMonth() + 1)
  const j = pad(d.getDate())
  const H = pad(d.getHours())
  const i = pad(d.getMinutes())
  const s = pad(d.getSeconds())
  return format
    .replace('Y', Y).replace('m', m).replace('d', j)
    .replace('H', H).replace('i', i).replace('s', s)
    .replace('U', Math.floor(d.getTime() / 1000))
}

// ── Language auto-detector ────────────────────────────────────────────────
export function detectLang(code) {
  const s = code.trim()

  if (/^<\?php\b/i.test(s))                             return 'php'
  if (/\?>/.test(s) && /\$[a-zA-Z_]/.test(s))          return 'php'
  if (/\becho\s+['"\$]/.test(s))                        return 'php'
  if (/\$[a-zA-Z_][a-zA-Z0-9_]*\s*=/.test(s) &&
      /function\s+\w+\s*\(/.test(s))                    return 'php'

  if (/<!DOCTYPE\s+html/i.test(s))                      return 'html'
  if (/^<html[\s>]/i.test(s))                           return 'html'
  if (/<(head|body|div|span|section|article|nav|main|header|footer|p|h[1-6]|ul|ol|li|table|tr|td|th|form|input|button|a|img|script|style|link|meta)\b/i.test(s) &&
      /<\/[a-z]/i.test(s))                              return 'html'

  if (/^(@import|@media|@keyframes|@charset|@font-face)\b/.test(s)) return 'css'
  if (/[a-z#.*\[][^{]*\{\s*[\w-]+\s*:\s*[^;]+;/.test(s))           return 'css'
  if (/^\s*[\w.#*\[,:\-]+\s*\{[\s\S]*?[\w-]+\s*:\s*[^;]+;/m.test(s)) return 'css'

  if (/\b(const|let|var)\s+\w+\s*=/.test(s))           return 'js'
  if (/=>\s*\{/.test(s))                                return 'js'
  if (/\bfunction\s*\w*\s*\([^)]*\)\s*\{/.test(s) &&
      !/\becho\b/.test(s))                              return 'js'
  if (/\b(import|export)\s+(default|{|\w)/.test(s))    return 'js'
  if (/\bconsole\.(log|warn|error)\s*\(/.test(s))      return 'js'
  if (/document\.|window\.|require\s*\(/.test(s))      return 'js'

  return null
}

// ── Prettier Worker ───────────────────────────────────────────────────────
let _worker      = null
let _pendingId   = 0
const _pending   = new Map()
let _workerReady = false
const _queue     = []

const WORKER_SRC = /* js */`
self.process = {
  env: { NODE_ENV: 'production' }, version: 'v18.0.0', versions: {},
  platform: 'browser', argv: [], cwd: () => '/', exit: () => {},
  hrtime: () => [0, 0], nextTick: (fn) => Promise.resolve().then(fn),
}
self.fs = {
  existsSync: () => false, readFileSync: () => '',
  readdirSync: () => [], statSync: () => ({ isDirectory: () => false }),
}
globalThis.process = self.process
globalThis.fs = self.fs

async function fetchPlugin(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to load ' + url + ': ' + res.status)
  const text = await res.text()
  ;(0, eval)(text)
}

async function init() {
  await fetchPlugin('https://unpkg.com/prettier@3.3.3/standalone.js')
  await fetchPlugin('https://unpkg.com/prettier@3.3.3/plugins/babel.js')
  await fetchPlugin('https://unpkg.com/prettier@3.3.3/plugins/estree.js')
  await fetchPlugin('https://unpkg.com/@prettier/plugin-php@0.22.2/standalone.js')

  const prettier = self.prettier
  if (!prettier) throw new Error('prettier failed to load')

  // Grab plugins from their known global names after eval
  const babel     = self.prettierPlugins?.babel
  const estree    = self.prettierPlugins?.estree
  const phpPlugin = self.prettierPlugins?.php

  // Fallback: some builds expose them as standalone globals
  const resolvedBabel  = babel     ?? self.prettierPluginBabel
  const resolvedEstree = estree    ?? self.prettierPluginEstree
  const resolvedPhp    = phpPlugin ?? self.prettierPluginPhp ?? self.pluginPhp

  if (!resolvedPhp)    throw new Error('PHP plugin not found on self after load. Available keys: ' + Object.keys(self).filter(k => k.toLowerCase().includes('prett') || k.toLowerCase().includes('plugin')).join(', '))
  if (!resolvedBabel)  throw new Error('Babel plugin not found')
  if (!resolvedEstree) throw new Error('Estree plugin not found')

  self.onmessage = async ({ data }) => {
    const { id, code, tabWidth, useTabs, singleQuote } = data
    try {
      const result = await prettier.format(code, {
        parser:     'php',
        plugins:    [resolvedBabel, resolvedEstree, resolvedPhp],
        tabWidth,
        useTabs,
        singleQuote,
        printWidth:  9999,
        braceStyle:  'psr-2',
      })
      self.postMessage({ id, result })
    } catch (e) {
      self.postMessage({ id, error: e.message })
    }
  }

  self.postMessage({ ready: true })
}

init().catch(e => {
  console.error('prettier worker init failed:', e)
  self.onmessage = ({ data }) => self.postMessage({ id: data.id, error: 'Worker init failed: ' + e.message })
})
`

function getWorker() {
  if (_worker) return _worker

  // Blob URL bypasses Vite entirely — no file resolution, no HTML 404 pages
  const blob = new Blob([WORKER_SRC], { type: 'application/javascript' })
  const url  = URL.createObjectURL(blob)
  _worker    = new Worker(url)
  URL.revokeObjectURL(url) // safe to revoke immediately after Worker() call

  _worker.onmessage = ({ data }) => {
    if (data.ready) {
      _workerReady = true
      _queue.forEach(msg => _worker.postMessage(msg))
      _queue.length = 0
      return
    }
    const { id, result, error } = data
    const handlers = _pending.get(id)
    _pending.delete(id)
    if (!handlers) return
    if (error) handlers.reject(new Error(error))
    else handlers.resolve(result)
  }

  _worker.onerror = (e) => {
    console.error('prettier worker error:', e)
    for (const [, handlers] of _pending) {
      handlers.reject(new Error('Prettier worker crashed: ' + e.message))
    }
    _pending.clear()
    _worker      = null
    _workerReady = false
  }

  return _worker
}

function formatWithWorker(payload) {
  return new Promise((resolve, reject) => {
    const id  = _pendingId++
    _pending.set(id, { resolve, reject })
    const msg = { id, ...payload }
    if (_workerReady) {
      getWorker().postMessage(msg)
    } else {
      getWorker()
      _queue.push(msg)
    }
  })
}

// ── Beautify ──────────────────────────────────────────────────────────────
export async function beautify(code, lang = 'php', opts = {}) {
  const { indent = '    ', quotes = 'single' } = opts
  switch (lang) {
    case 'php':  return await beautifyPHP(code, indent, quotes)
    case 'js':   return beautifyJS(code, indent, quotes)
    case 'css':  return beautifyCSS(code, indent)
    case 'html': return beautifyHTML(code, indent)
    default:     return code
  }
}

// ── PHP beautifier ────────────────────────────────────────────────────────
async function beautifyPHP(raw, indent, quotes) {
  const needsTag    = !/^\s*<\?php\b/i.test(raw)
  const code        = needsTag ? `<?php\n${raw}` : raw
  const tabWidth    = indent === '\t' ? 4 : indent.length
  const useTabs     = indent === '\t'
  const singleQuote = quotes === 'single'

  try {
    let result = await formatWithWorker({ code, tabWidth, useTabs, singleQuote })
    if (needsTag) result = result.replace(/^<\?php\r?\n/, '')
    return result.trimEnd()
  } catch (e) {
    console.error('beautifyPHP error:', e.message) // ← add this
    throw new Error('Could not beautify — check PHP syntax.\n' + e.message)
  }
}

// ── JS beautifier ─────────────────────────────────────────────────────────
function beautifyJS(raw, indent, quotes) {
  const strings = []
  let s = raw

  s = s.replace(/`(?:[^`\\]|\\.|\$\{[^}]*\})*`/g, (m) => {
    strings.push(m); return `\x00STR${strings.length - 1}\x00`
  })
  s = s.replace(/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/gs, (m) => {
    strings.push(m); return `\x00STR${strings.length - 1}\x00`
  })

  const lineComments = []
  s = s.replace(/\/\/[^\n]*/g, (m) => { lineComments.push(m); return `\x00LC${lineComments.length - 1}\x00` })
  const blockComments = []
  s = s.replace(/\/\*[\s\S]*?\*\//g, (m) => { blockComments.push(m); return `\x00BC${blockComments.length - 1}\x00` })

  s = s.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  s = s.replace(/[ \t]+/g, ' ')

  s = s.replace(/([^=!<>\s])===([^>])/g, '$1 === $2')
  s = s.replace(/([^=!<>\s])!==([^>])/g, '$1 !== $2')
  s = s.replace(/([^=!<>\s])==([^=])/g, '$1 == $2')
  s = s.replace(/([^=!<>\s])!=([^=])/g, '$1 != $2')
  s = s.replace(/([^=!<>\s])=>([^>])/g, '$1 => $2')
  s = s.replace(/([^=!<>+\-*\/.&|^%\s])=([^=>\s])/g, '$1 = $2')
  s = s.replace(/,([^\s])/g, ', $1')
  s = s.replace(/\b(if|else if|for|while|switch|catch)\s*\(/g, '$1 (')

  s = s.replace(/\)\s*\n\s*\{/g, ') {')
  s = s.replace(/\belse\s*\n\s*\{/g, 'else {')
  s = s.replace(/\btry\s*\n\s*\{/g, 'try {')
  s = s.replace(/\}\s*\n\s*else\b/g, '} else')
  s = s.replace(/\}\s*\n\s*catch\b/g, '} catch')
  s = s.replace(/\}\s*\n\s*finally\b/g, '} finally')

  s = s.replace(/\{([^\n])/g, '{\n$1')
  s = s.replace(/([^\n])\}/g, '$1\n}')
  s = s.replace(/;([^\n])/g, ';\n$1')

  s = s.replace(/\}\s*(else\s+if\b|else\b|catch\s*\(|finally\b)/g, '}\n$1')

  s = reIndent(s, indent)

  s = s.replace(/\x00BC(\d+)\x00/g, (_, i) => blockComments[+i])
  s = s.replace(/\x00LC(\d+)\x00/g, (_, i) => lineComments[+i])

  if (quotes !== 'keep') {
    s = s.replace(/\x00STR(\d+)\x00/g, (_, i) => {
      let str = strings[+i]
      if (str.startsWith('`')) return str
      if (quotes === 'single' && str.startsWith('"')) {
        const inner = str.slice(1, -1)
        if (!inner.includes("'")) str = "'" + inner.replace(/\\"/g, '"') + "'"
      } else if (quotes === 'double' && str.startsWith("'")) {
        const inner = str.slice(1, -1)
        if (!inner.includes('"')) str = '"' + inner.replace(/\\'/g, "'") + '"'
      }
      return str
    })
  } else {
    s = s.replace(/\x00STR(\d+)\x00/g, (_, i) => strings[+i])
  }

  s = s.replace(/\n{3,}/g, '\n\n').trim()
  return s
}

// ── CSS beautifier ────────────────────────────────────────────────────────
function beautifyCSS(raw, indent) {
  const comments = []
  let s = raw
  s = s.replace(/\/\*[\s\S]*?\*\//g, (m) => { comments.push(m); return `\x00C${comments.length - 1}\x00` })

  s = s.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  s = s.replace(/[ \t]+/g, ' ').trim()

  s = s.replace(/\{([^{}]*)\}/g, (_, inner) => {
    const decls = inner.split(';').map(d => d.trim()).filter(d => d.length > 0)
    if (decls.length === 0) return '{ }'
    return '{\n' + decls.map(d => indent + d + ';').join('\n') + '\n}'
  })

  s = s.replace(/([^\s])\{/g, '$1 {')
  s = s.replace(/\}([^\n])/g, '}\n$1')
  s = s.replace(/:([^\s:\/])/g, ': $1')
  s = s.replace(/,([^\n])/g, ',\n$1')

  s = s.replace(/\x00C(\d+)\x00/g, (_, i) => comments[+i])
  s = s.replace(/\n{3,}/g, '\n\n').trim()
  return s
}

// ── HTML beautifier ───────────────────────────────────────────────────────
function beautifyHTML(raw, indent) {
  const protected_ = []
  let s = raw
  s = s.replace(/<(pre|script|style)([\s\S]*?)>([\s\S]*?)<\/\1>/gi, (m) => {
    protected_.push(m); return `\x00P${protected_.length - 1}\x00`
  })

  s = s.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  s = s.replace(/>\s+</g, '>\n<')
  s = s.replace(/[ \t]+/g, ' ')

  const VOID   = new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'])
  const INLINE = new Set(['a','abbr','acronym','b','bdo','big','br','cite','code','dfn','em','i','img','input','kbd','label','map','object','output','q','samp','select','small','span','strong','sub','sup','textarea','time','tt','var'])

  const lines = s.split('\n')
  let depth = 0
  const result = []

  for (let raw of lines) {
    const line = raw.trim()
    if (!line) continue

    const closeMatch = line.match(/^<\/([a-zA-Z][a-zA-Z0-9]*)/)
    if (closeMatch && !INLINE.has(closeMatch[1].toLowerCase())) {
      depth = Math.max(0, depth - 1)
    }

    result.push(indent.repeat(depth) + line)

    const openMatch = line.match(/^<([a-zA-Z][a-zA-Z0-9]*)/)
    if (openMatch) {
      const tag = openMatch[1].toLowerCase()
      const selfClose = line.endsWith('/>') || VOID.has(tag)
      const hasClose  = line.includes(`</${tag}>`)
      if (!selfClose && !hasClose && !INLINE.has(tag) && !line.startsWith('</')) {
        depth++
      }
    }
  }

  s = result.join('\n')
  s = s.replace(/\x00P(\d+)\x00/g, (_, i) => protected_[+i])
  s = s.replace(/\n{3,}/g, '\n\n').trim()
  return s
}

// ── Shared: brace-based re-indenter ──────────────────────────────────────
function reIndent(code, indent) {
  const lines = code.split('\n').map(l => l.trim()).filter((l, i, a) => {
    if (l === '' && i > 0 && a[i - 1] === '') return false
    return true
  })

  let depth = 0
  const out  = []

  for (const line of lines) {
    if (!line) { out.push(''); continue }

    const leadingClose = (line.match(/^[}\])]*/)?.[0] ?? '').length
    depth = Math.max(0, depth - leadingClose)

    out.push(indent.repeat(depth) + line)

    const opens         = (line.match(/[{[(]/g) ?? []).length
    const totalClose    = (line.match(/[}\])]/g) ?? []).length
    const trailingClose = totalClose - leadingClose
    depth = Math.max(0, depth + opens - trailingClose)
  }

  return out.join('\n')
}