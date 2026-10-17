/**
 * anti-popup.js
 * سكريبت بسيط تحطه في موقعك عشان يمنع الإعلانات المنبثقة (popup/popunder)
 * اللي بعض خدمات استضافة الفيديو بتحقنها تلقائياً في صفحتك.
 *
 * إزاي تستخدمه:
 * حط السكريبت ده في وسم <head> بتاع صفحتك، قبل أي كود بتاع مشغّل الفيديو/الاستضافة:
 *   <script src="anti-popup.js"></script>
 *
 * ملحوظة مهمة: السكريبت ده مش بديل كامل لأداة زي uBlock Origin (اللي عندها آلاف
 * قوائم الفلاتر المحدّثة باستمرار من مجتمع ضخم) - هو بيغطي أكتر الحيل شيوعاً
 * اللي بتستخدمها خدمات الفيديو المجانية بس.
 */

(function () {
  "use strict";

  // ============ ⚙️ إعدادات: حط هنا دومينات شبكات الإعلانات اللي إنت مختارها بنفسك ============
  // أي رابط أو iframe من الدومينات دي، السكريبت مش هيلمسه خالص - عشان تقدر تحط
  // إعلانات AdSense أو Monetag بتاعتك براحتك من غير ما الأداة دي تمنعها بالغلط.
  // مثال لما تفعّل AdSense أو Monetag، ضيف دوميناتهم هنا:
  const ALLOWED_AD_DOMAINS = [
    // "googlesyndication.com",
    // "doubleclick.net",
    // "googleadservices.com",
    // "pagead2.googlesyndication.com",
    // "monetag.com",
    // "your-monetag-subdomain.com",
  ];

  function isAllowedDomain(url) {
    if (!url) return false;
    try {
      const hostname = new URL(url, window.location.href).hostname;
      return ALLOWED_AD_DOMAINS.some((domain) => hostname === domain || hostname.endsWith("." + domain));
    } catch (e) {
      return false;
    }
  }

  // ============ 0) تتبّع أنهي فيديو اتدوس عليه قبل أي محاولة إعلان ============
  // عشان الميزة دي تشتغل، حط data-video-id="اسم_أو_رقم_الفيديو" على زرار
  // التشغيل أو الصورة المصغّرة بتاعة كل فيديو في منصتك، مثال:
  //   <div class="play-button" data-video-id="lesson-12">▶</div>
  let lastClickedVideo = null;

  document.addEventListener(
    "click",
    function (e) {
      let el = e.target;
      while (el && el !== document.body) {
        if (el.dataset && el.dataset.videoId) {
          lastClickedVideo = { id: el.dataset.videoId, time: Date.now() };
          console.log("▶️ anti-popup: اتدوس فيديو:", lastClickedVideo.id);
          break;
        }
        el = el.parentElement;
      }
    },
    true
  );

  function attributeToVideo() {
    if (lastClickedVideo && Date.now() - lastClickedVideo.time < 4000) {
      return lastClickedVideo.id;
    }
    return "غير معروف (مفيش فيديو اتدوس عليه في آخر 4 ثواني)";
  }

  // ============ 1) منع window.open (أكتر حيلة شائعة لفتح "نافذة إعلان" جديدة) ============
  const adAttempts = []; // سجل بكل محاولات الإعلان + الفيديو المسؤول عنها

  const originalOpen = window.open;
  window.open = function (...args) {
    const targetUrl = args[0] || "";
    if (isAllowedDomain(targetUrl)) {
      console.log("✅ anti-popup: مسموح (دومين إعلانك الشرعي):", targetUrl);
      return originalOpen.apply(window, args);
    }
    const culprit = attributeToVideo();
    console.warn("🚫 anti-popup: اتمنع window.open لـ:", targetUrl || "(بدون رابط)", "| سببه الفيديو:", culprit);
    adAttempts.push({ type: "window.open", url: targetUrl, video: culprit, time: new Date().toISOString() });
    return null; // نرجع null بدل ما نفتح النافذة فعلياً
  };

  // [تعديل المنصة] نافذة مضمونة لأكواد المنصة نفسها (زي زر الإبلاغ عن خطأ)، عشان الحماية
  // ما تمنعش window.open الشرعي بتاعها. أكواد الفيديوهات الخارجية ما تعرفش بيها.
  window.hakimTrustedOpen = function (...args) {
    return originalOpen.apply(window, args);
  };

  // ============ 2) منع محاولات إعادة توجيه الصفحة كلها عند أي دوسة (كليك-جاكينج شائع) ============
  // بعض السكريبتات بتحط مستمع "click" على document كله وتحاول تفتح تاب/رابط جديد
  // بمجرد أي دوسة في أي حتة بالصفحة. الكود ده بيوقف الانتشار المبكر لمحاولات زي دي
  // اللي بتيجي من مصادر مش موثوقة (iframes بتاعة الاستضافة نفسها مثلاً).
  document.addEventListener(
    "click",
    function (e) {
      // لو فيه محاولة تغيير location.href من كود مش بتاعك، صعب نمنعها 100% من هنا
      // بس بنقدر نمنع أي <a> جديد اتحقن ديناميكياً وعنده target="_blank" لدومين غريب
      let el = e.target;
      while (el && el !== document.body) {
        if (el.tagName === "A" && el.target === "_blank" && el.dataset.injectedAd) {
          e.preventDefault();
          e.stopPropagation();
          console.warn("🚫 anti-popup: اتمنع لينك إعلان مربوط بالدوسة:", el.href);
          return;
        }
        el = el.parentElement;
      }
    },
    true // capture phase - عشان نمسكها قبل أي حد تاني
  );

  // ============ 3) إزالة أي iframe/div مشبوه بيتحقن ديناميكياً بمعايير إعلانات شائعة ============
  const SUSPICIOUS_PATTERNS = [
    /popunder/i,
    /popup-ad/i,
    /\bad[-_]?overlay\b/i,
    /banner-ad/i,
  ];

  function looksLikeAd(el) {
    const attrs = [el.id, el.className, el.src || "", el.getAttribute("data-src") || ""].join(" ");
    return SUSPICIOUS_PATTERNS.some((pattern) => pattern.test(attrs));
  }

  function removeIfAd(el) {
    if (!(el instanceof Element)) return;
    if (isAllowedDomain(el.src)) return; // إعلانك الشرعي - منلمسوش خالص
    if (el.tagName === "IFRAME" || el.tagName === "DIV") {
      if (looksLikeAd(el)) {
        console.warn("🚫 anti-popup: اتشال عنصر شكله إعلان:", el);
        el.remove();
      }
    }
  }

  // ============ 3.5) خيار أخير (يدوي فقط): حط sandbox على iframe الاستضافة ============
  // السطور دي مبتشتغلش لوحدها خالص. الـsandbox بيوقف window.open والتنقل الكامل
  // للصفحة من جوه الـiframe، لكنه بيقدر كمان يبوّظ تشغيل الفيديو نفسه (كوكيز،
  // تخزين محلي، أو أي حاجة الاستضافة محتاجاها عشان الفيديو يشتغل عادي).
  // عشان كده مش بنحطه تلقائي؛ بيتفعّل بس لو ضغطت على الزرار المخصص له في الصفحة
  // أو نديت الأمر يدوياً من الكونسول: antiPopupForceSandbox()
  function forceSandboxIframe(iframe) {
    if (!(iframe instanceof HTMLIFrameElement)) return;
    if (isAllowedDomain(iframe.src)) return; // إعلانك الشرعي - سيبه يشتغل عادي
    if (iframe.dataset.antiPopupSandboxed) return; // اتعالج قبل كده

    iframe.setAttribute("sandbox", "allow-scripts allow-same-origin");
    iframe.dataset.antiPopupSandboxed = "true";
    console.log("🛡️ anti-popup: اتحط sandbox يدوياً على iframe:", iframe.src || "(بدون src)");
  }

  const observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      mutation.addedNodes.forEach(function (node) {
        removeIfAd(node);
        if (node.querySelectorAll) {
          node.querySelectorAll("iframe, div").forEach(removeIfAd);
        }
      });
    });
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });

  // نادِ على window.antiPopupForceSandbox() (أو دوس الزرار في الصفحة) عشان تفعّل
  // الـsandbox يدوياً على كل iframes الاستضافة، لو باقي الحماية مكانتش كفاية
  window.antiPopupForceSandbox = function () {
    const iframes = document.querySelectorAll("iframe");
    if (!iframes.length) {
      console.warn("⚠️ anti-popup: مفيش iframe في الصفحة عشان نحط عليه sandbox");
      return;
    }
    iframes.forEach(forceSandboxIframe);
    return "تم تفعيل الـsandbox على " + iframes.length + " iframe";
  };

  // ============ 4) منع فتح تابات جديدة عن طريق تغيير window.location من كود خارجي مشبوه ============
  // (تحذير: التقنية دي محدودة - مواقع كتير بتحتاج location.href تتغيّر بشكل شرعي،
  //  فمبنمنعش التغيير نفسه، بس بنسجّله في الكونسول عشان تراجعه وتتأكد إنه شرعي)
  // [تعديل المنصة] بنقارن origin + pathname بس، لأن المنصة بتحدّث ?ep=رقم_الحلقة في الرابط
  // (history.replaceState) وده تنقّل داخل نفس الصفحة مش إعادة توجيه.
  const pageKey = () => window.location.origin + window.location.pathname;
  let originalPage = pageKey();
  let originalHref = window.location.href;

  setInterval(function () {
    if (pageKey() === originalPage) { originalHref = window.location.href; return; }
    if (window.location.href !== originalHref) {
      const culprit = attributeToVideo();
      console.warn("⚠️ anti-popup: الصفحة اتنقلت من", originalHref, "لـ", window.location.href, "| سببه الفيديو:", culprit);
      adAttempts.push({ type: "redirect", from: originalHref, to: window.location.href, video: culprit, time: new Date().toISOString() });
      originalHref = window.location.href;
      originalPage = pageKey();
    }
  }, 1000);

  // نادِ على window.antiPopupReport() في أي وقت من الـConsole عشان تشوف ملخص كل المحاولات المسجّلة
  window.antiPopupReport = function () {
    console.table(adAttempts);
    return adAttempts;
  };

  console.log("✅ anti-popup.js شغال - بيراقب الصفحة ضد إعلانات popup/popunder الشائعة");
  console.log("💡 اكتب antiPopupReport() في أي وقت عشان تشوف ملخص كل محاولات الإعلان اللي اتمنعت وأنهي فيديو سببها");
  console.log("🛡️ لو الحماية العادية مكانتش كفاية، اكتب antiPopupForceSandbox() (أو دوس الزرار في الصفحة) كخيار أخير");
})();
