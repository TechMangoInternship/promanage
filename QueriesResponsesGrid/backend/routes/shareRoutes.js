const express = require('express');
const crypto = require('crypto');
const GridShare = require('../models/GridShare');
const GridRow = require('../models/GridRow');

const router = express.Router();

// ── POST /api/share/generate — Generate ONE share link for entire grid ──
router.post('/generate', async (req, res, next) => {
  try {
    const { gridId } = req.body;
    if (!gridId) {
      return res.status(400).json({ success: false, error: 'gridId is required' });
    }

    // Find or create a single grid-level share token
    let gridShare = await GridShare.findOne({ gridId });
    if (!gridShare) {
      const token = crypto.randomUUID();
      gridShare = await GridShare.create({ token, gridId });
    }

    // Count how many rows have queries
    const rows = await GridRow.find({ gridId }).sort({ order: 1, createdAt: 1 });
    const queryCount = rows.filter(r => (r.data?.query || '').trim()).length;

    const shareUrl = `${req.protocol}://${req.get('host')}/api/share/${gridShare.token}`;

    res.json({
      success: true,
      data: {
        token: gridShare.token,
        shareUrl,
        queryCount,
        singleLink: true,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ── GET /api/share/:token — Public page showing ALL unanswered questions ──
router.get('/:token', async (req, res, next) => {
  try {
    const gridShare = await GridShare.findOne({ token: req.params.token });
    if (!gridShare) {
      return res.status(404).send(`
        <html><body style="font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f5f5f7;margin:0">
          <div style="text-align:center;padding:40px"><h2>Link not found or expired</h2></div>
        </body></html>
      `);
    }

    // Fetch all rows for this grid, sorted by order
    const allRows = await GridRow.find({ gridId: gridShare.gridId }).sort({ order: 1, createdAt: 1 });

    console.log(`[Share] GridShare ${gridShare._id} -> gridId ${gridShare.gridId}, found ${allRows.length} rows`);
    allRows.forEach(r => console.log(`[Share] Row ${r._id}: data exists=${!!r.data}, query="${(r.data?.query || '').trim().substring(0, 50)}"`));

    const rowsJson = JSON.stringify(allRows.map(r => ({
      _id: String(r._id),
      query: r.data?.query || '',
      response: r.data?.response || '',
    })));

    const token = req.params.token;

    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Question & Answer Session</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; background: linear-gradient(135deg, #f5f5f7 0%, #e8e8f0 100%); min-height: 100vh; padding: 40px 20px; }
          .container { max-width: 700px; margin: 0 auto; }
          .card { background: rgba(255,255,255,0.92); backdrop-filter: blur(20px); border-radius: 24px; padding: 40px; box-shadow: 0 20px 60px rgba(0,0,0,0.08), 0 0 40px rgba(120,112,255,0.06); border: 1px solid rgba(0,0,0,0.06); }
          .badge { display: inline-block; font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; background: linear-gradient(135deg, #7870ff, #a060ff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 6px; }
          h1 { font-size: 24px; font-weight: 700; color: #1d1d1f; margin-bottom: 6px; }
          .subtitle { font-size: 14px; color: #888; margin-bottom: 32px; }
          .progress-bar { background: #e8e8ed; border-radius: 999px; height: 6px; margin-bottom: 32px; overflow: hidden; }
          .progress-fill { height: 100%; background: linear-gradient(135deg, #7870ff, #34d399); border-radius: 999px; transition: width 0.5s ease; }
          .question-card { background: #f5f5f7; border-radius: 16px; padding: 24px; margin-bottom: 16px; border: 1px solid #e8e8ed; transition: all 0.3s ease; }
          .question-card.answered { opacity: 0.5; pointer-events: none; }
          .q-number { display: inline-block; width: 28px; height: 28px; border-radius: 8px; background: linear-gradient(135deg, #7870ff, #a060ff); color: #fff; font-size: 13px; font-weight: 700; text-align: center; line-height: 28px; margin-right: 10px; }
          .q-text { font-size: 16px; font-weight: 600; color: #1d1d1f; margin-bottom: 16px; line-height: 1.4; }
          label { display: block; font-size: 12px; font-weight: 600; color: #666; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.05em; }
          textarea { width: 100%; min-height: 90px; padding: 12px 14px; border: 1px solid #d4d4d8; border-radius: 12px; font-size: 14px; font-family: inherit; line-height: 1.5; resize: vertical; transition: border-color 0.2s; outline: none; background: #fff; }
          textarea:focus { border-color: #7870ff; box-shadow: 0 0 0 3px rgba(120,112,255,0.1); }
          textarea:disabled { background: #f0f0f0; color: #999; }
          .submit-btn { margin-top: 12px; padding: 10px 24px; background: linear-gradient(135deg, #7870ff, #a060ff); color: #fff; border: none; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; box-shadow: 0 3px 12px rgba(120,112,255,0.2); }
          .submit-btn:hover { transform: translateY(-1.5px); box-shadow: 0 5px 20px rgba(120,112,255,0.3); }
          .submit-btn:active { transform: scale(0.97); }
          .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
          .answer-display { margin-top: 12px; padding: 12px 14px; background: #f0faf5; border-radius: 12px; border: 1px solid #86efac; font-size: 14px; color: #1d1d1f; line-height: 1.5; }
          .answer-display::before { content: "Answered: "; font-weight: 600; color: #16a34a; }
          .complete-banner { text-align: center; padding: 40px 20px; }
          .complete-banner .check { font-size: 48px; margin-bottom: 12px; }
          .complete-banner h2 { font-size: 22px; color: #1d1d1f; margin-bottom: 8px; }
          .complete-banner p { color: #888; font-size: 14px; }
          .footer { margin-top: 20px; font-size: 11px; color: #bbb; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="card">
            <div class="badge">Question &amp; Answer Session</div>
            <h1>Questions are waiting for answers</h1>
            <p class="subtitle">Answer each question below. Your responses will be saved as you go.</p>
            <div id="questionsContainer"></div>
            <div id="completeBanner" class="complete-banner" style="display:none">
              <div class="check" style="font-size:48px;margin-bottom:12px;font-weight:700;color:#16a34a;">\u2713</div>
              <h2>All questions answered!</h2>
              <p>Thank you for your responses. They have been recorded.</p>
            </div>
            <div class="footer">Powered by Project Grid</div>
          </div>
        </div>

        <script>
          'use strict';
          var allRows = ${rowsJson};
          var questionsContainer = document.getElementById('questionsContainer');
          var completeBanner = document.getElementById('completeBanner');
          var token = '${token}';

          function escapeHtml(text) {
            var d = document.createElement('div');
            d.textContent = text || '';
            return d.innerHTML;
          }

          function render() {
            var unanswered = allRows.filter(function(r) { return r.query.trim() && !r.response.trim(); });
            var answered = allRows.filter(function(r) { return r.query.trim() && r.response.trim(); });
            var total = unanswered.length + answered.length;
            var progress = total > 0 ? (answered.length / total) * 100 : 0;

            var html = '';

            if (unanswered.length === 0 && answered.length > 0) {
              completeBanner.style.display = 'block';
              questionsContainer.innerHTML = '';
              return;
            }

            if (total === 0) {
              questionsContainer.innerHTML = '<div style="text-align:center;padding:60px 20px;color:#888;font-size:15px;line-height:1.6"><strong style="color:#555">No questions yet</strong><br>This grid has no questions to answer. Please add questions to the Queries &amp; Responses grid first, then generate a new link.</div>';
              return;
            }

            if (total > 0) {
              html += '<div class="progress-bar"><div class="progress-fill" style="width:' + progress + '%"></div></div>';
            }

            // Show answered questions collapsed at top
            answered.forEach(function(r, i) {
              html += '<div class="question-card answered">';
              html += '<div><span class="q-number">' + (i + 1) + '</span><span class="q-text" style="text-decoration:line-through;opacity:0.6">' + escapeHtml(r.query) + '</span></div>';
              html += '<div class="answer-display">' + escapeHtml(r.response) + '</div>';
              html += '</div>';
            });

            // Show unanswered questions
            unanswered.forEach(function(r, i) {
              var num = answered.length + i + 1;
              html += '<div class="question-card" id="qcard-' + r._id + '">';
              html += '<div><span class="q-number">' + num + '</span><span class="q-text">' + escapeHtml(r.query) + '</span></div>';
              html += '<label for="resp-' + r._id + '">Your Answer:</label>';
              html += '<textarea id="resp-' + r._id + '" class="answer-textarea" placeholder="Type your answer here..."></textarea>';
              html += '</div>';
            });

            // Single submit button for all answers
            if (unanswered.length > 0) {
              html += '<div style="text-align:center;margin-top:24px">';
              html += '<button id="submitAllBtn" class="submit-btn" style="padding:14px 48px;font-size:16px">Submit All Answers</button>';
              html += '</div>';
            }

            questionsContainer.innerHTML = html;
          }

          // Single submit button for all answers
          document.addEventListener('click', function(e) {
            var btn = e.target.closest('#submitAllBtn');
            if (!btn || btn.disabled) return;

            var unanswered = allRows.filter(function(r) { return r.query.trim() && !r.response.trim(); });
            var submissions = [];

            unanswered.forEach(function(r) {
              var textarea = document.getElementById('resp-' + r._id);
              if (textarea) {
                var answer = textarea.value.trim();
                if (answer) {
                  submissions.push({ rowId: r._id, response: answer });
                }
              }
            });

            if (submissions.length === 0) {
              alert('Please fill in at least one answer before submitting.');
              return;
            }

            btn.disabled = true;
            btn.textContent = 'Submitting ' + submissions.length + ' answer' + (submissions.length !== 1 ? 's' : '') + '...';

            var completed = 0;
            var total = submissions.length;
            var hasError = false;

            function submitNext(index) {
              if (index >= total) {
                render();
                return;
              }

              fetch('/api/share/' + token, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rowId: submissions[index].rowId, response: submissions[index].response })
              })
              .then(function(res) { return res.json(); })
              .then(function(data) {
                if (data.success) {
                  var row = allRows.find(function(r) { return r._id === submissions[index].rowId; });
                  if (row) row.response = submissions[index].response;
                  completed++;
                  btn.textContent = 'Submitting (' + completed + '/' + total + ')...';
                  submitNext(index + 1);
                } else {
                  hasError = true;
                  btn.disabled = false;
                  btn.textContent = 'Submit All Answers';
                  alert('Error submitting answer: ' + (data.error || 'Submission failed'));
                }
              })
              .catch(function() {
                hasError = true;
                btn.disabled = false;
                btn.textContent = 'Submit All Answers';
                alert('Network error. Please try again.');
              });
            }

            submitNext(0);
          });

          render();
        </script>
      </body>
      </html>
    `);
  } catch (error) {
    next(error);
  }
});

// ── POST /api/share/:token — Submit an answer for a specific row ──
router.post('/:token', async (req, res, next) => {
  try {
    const { rowId, response } = req.body;
    if (!rowId) {
      return res.status(400).json({ success: false, error: 'rowId is required' });
    }
    if (!response || !response.trim()) {
      return res.status(400).json({ success: false, error: 'Response is required' });
    }

    // Verify the token exists
    const gridShare = await GridShare.findOne({ token: req.params.token });
    if (!gridShare) {
      return res.status(404).json({ success: false, error: 'Link not found' });
    }

    // Find the row and verify it belongs to the shared grid
    const row = await GridRow.findById(rowId);
    if (!row) {
      return res.status(404).json({ success: false, error: 'Row not found' });
    }

    // Update the response field
    row.data = { ...row.data, response: response.trim() };
    row.markModified('data');
    await row.save();

    res.json({ success: true, message: 'Response recorded' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
