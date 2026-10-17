/* ============================================================
   media-utils.js — أدوات مشتركة بين صفحات الكورس ولوحة الأدمن
   - استخراج رابط الفيديو من كود تضمين <iframe> كامل
   - تحويل روابط يوتيوب/فيميو العادية لرابط تضمين شغّال
   - اكتشاف نوع المصدر وطريقة تشغيله (ملف مباشر / HLS / تضمين)
   ============================================================ */
(function (w) {
  'use strict';

  function extractEmbedSrc(raw) {
    let s = String(raw == null ? '' : raw).trim();
    if (/<\s*iframe/i.test(s)) {
      const m = s.match(/<\s*iframe[^>]*?\ssrc\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))/i);
      s = m ? (m[1] || m[2] || m[3] || '') : '';
    }
    s = s.replace(/&amp;/g, '&').trim();
    if (s.indexOf('//') === 0) s = 'https:' + s;
    return s;
  }

  function youTubeId(u) {
    const m = String(u).match(/(?:youtube\.com\/(?:watch\?(?:[^#]*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
    return m ? m[1] : null;
  }
  function vimeoId(u) {
    const m = String(u).match(/vimeo\.com\/(?:video\/)?(\d+)/);
    return m ? m[1] : null;
  }

  /* رابط يوتيوب/فيميو العادي ما بيتفتحش داخل iframe، فبنحوّله لرابط التضمين الرسمي */
  function normalizeEmbedUrl(url) {
    const s = extractEmbedSrc(url);
    const yt = youTubeId(s); if (yt) return 'https://www.youtube.com/embed/' + yt;
    const vm = vimeoId(s); if (vm) return 'https://player.vimeo.com/video/' + vm;
    return s;
  }

  var NATIVE_EXT = ['mp4', 'm4v', 'webm', 'ogg', 'ogv', 'mov'];
  var FORCEABLE = ['direct', 'hls', 'embed'];

  /* forced: '' | 'auto' | 'direct' | 'hls' | 'embed' */
  function detect(url, forced) {
    var src = extractEmbedSrc(url);
    var f = FORCEABLE.indexOf(forced) >= 0 ? forced : 'auto';
    var clean = src.split('#')[0].split('?')[0].toLowerCase();
    var ext = (clean.match(/\.([a-z0-9]{2,5})$/) || [])[1] || '';
    function embed(conf) { return { sourceType: 'embed', playbackStrategy: 'iframe', confidence: conf, src: normalizeEmbedUrl(src) }; }

    if (f === 'embed') return embed('high');
    if (f === 'hls') return { sourceType: 'hls', playbackStrategy: 'hls', confidence: 'high', src: src };
    if (f === 'direct') return { sourceType: ext || 'direct', playbackStrategy: 'native', confidence: 'high', src: src };

    if (youTubeId(src) || vimeoId(src)) return embed('high');
    if (NATIVE_EXT.indexOf(ext) >= 0) return { sourceType: ext, playbackStrategy: 'native', confidence: 'high', src: src };
    if (ext === 'mkv') return { sourceType: 'mkv', playbackStrategy: 'native', confidence: 'medium', src: src };
    if (ext === 'm3u8') return { sourceType: 'hls', playbackStrategy: 'hls', confidence: 'high', src: src };
    if (ext === 'ts' || ext === 'm2ts') return { sourceType: 'ts', playbackStrategy: 'native', confidence: 'low', src: src };
    return embed('low');
  }

  w.HakimMedia = { extractEmbedSrc: extractEmbedSrc, normalizeEmbedUrl: normalizeEmbedUrl, detect: detect };
})(window);
