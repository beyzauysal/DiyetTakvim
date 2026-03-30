const express = require("express");

const router = express.Router();

/**
 * POST /connections — Gereksinim dokümanında geçen bağlantı; uygulamada eşleşme kayıt + davet kodu ile yapılır.
 */
router.post("/", (req, res) => {
  res.status(400).json({
    message:
      "Danışan–diyetisyen eşleştirmesi POST /auth/register ile davet kodu kullanılarak yapılır.",
    hint: "Diyetisyen davet kodunu POST /invite-code veya kayıt sonrası profilden paylaşır.",
  });
});

module.exports = router;
