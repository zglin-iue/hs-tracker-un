(function () {
  const codeInput = document.getElementById('hs-code');
  const yearInput = document.getElementById('target-year');
  const convertButton = document.getElementById('convert-button');
  const formMessage = document.getElementById('form-message');
  const pathTable = document.getElementById('path-table');
  const targetResults = document.getElementById('target-results');

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, function (character) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character];
    });
  }

  function setBusy(isBusy) {
    convertButton.disabled = isBusy;
    convertButton.querySelector('span').textContent = isBusy ? '正在转换…' : '开始转换';
    convertButton.querySelector('.button-glyph').textContent = isBusy ? '↻' : '▶';
  }

  function edgeClass(result, version, code) {
    if (version === result.source_version && code === result.input_code) return 'query';
    const incoming = result.edges.filter(function (edge) {
      return edge.to_version === version && edge.to === code;
    });
    if (incoming.some(function (edge) { return edge.relation === 'implicit_identity'; })) return 'continued';
    const sourceCount = new Set(incoming.map(function (edge) { return edge.from; })).size;
    if (incoming.length > 1 || sourceCount > 1) return 'branch';
    if (incoming.some(function (edge) { return edge.relation === 'direct' && edge.from !== edge.to; })) return 'changed';
    return 'continued';
  }

  function renderPath(result) {
    const columns = result.versions.map(function (version, index) {
      const codes = version.codes.length
        ? '<div class="code-stack">' + version.codes.map(function (code) {
            return '<div class="code-pill ' + edgeClass(result, version.key, code) + '" data-version-key="' + escapeHtml(version.key) + '" data-code="' + escapeHtml(code) + '">' + escapeHtml(code) + '</div>';
          }).join('') + '</div>'
        : '<div class="code-stack"><div class="path-empty">无对应代码</div></div>';
      return '<div class="version-column">'
        + codes
        + '</div>';
    }).join('');
    const timeline = result.versions.map(function (version, index) {
      const arrow = index < result.versions.length - 1 ? '<span class="timeline-arrow" aria-hidden="true"></span>' : '';
      return '<div class="timeline-item"><span>HS ' + escapeHtml(version.release_year) + '</span></div>' + arrow;
    }).join('');
    pathTable.innerHTML = '<div class="path-visualizer"><div class="path-grid">' + columns + '<div class="edge-layer" aria-hidden="true"></div></div><div class="path-timeline">' + timeline + '</div></div>';
    requestAnimationFrame(function () { drawEdges(result); });
  }

  function drawEdges(result) {
    const grid = pathTable.querySelector('.path-grid');
    const layer = pathTable.querySelector('.edge-layer');
    if (!grid || !layer) return;
    layer.innerHTML = '';
    const gridRect = grid.getBoundingClientRect();
    const visualEdges = result.edges.map(function (edge) {
      const fromVersionIndex = result.versions.findIndex(function (version) { return version.key === edge.from_version; });
      const toVersionIndex = result.versions.findIndex(function (version) { return version.key === edge.to_version; });
      const from = grid.querySelector('[data-version-key="' + edge.from_version + '"][data-code="' + edge.from + '"]');
      const to = grid.querySelector('[data-version-key="' + edge.to_version + '"][data-code="' + edge.to + '"]');
      if (edge.from_version === edge.to_version || !from || !to || fromVersionIndex === -1 || toVersionIndex === -1) return null;
      const earlier = fromVersionIndex < toVersionIndex ? from : to;
      const later = fromVersionIndex < toVersionIndex ? to : from;
      return {
        edge: edge,
        from: from,
        to: to,
        earlier: earlier,
        later: later,
        startKey: earlier.dataset.versionKey + ':' + earlier.dataset.code,
        endKey: later.dataset.versionKey + ':' + later.dataset.code,
      };
    }).filter(Boolean);
    const outgoing = {};
    const incoming = {};
    visualEdges.forEach(function (item) {
      (outgoing[item.startKey] || (outgoing[item.startKey] = [])).push(item);
      (incoming[item.endKey] || (incoming[item.endKey] = [])).push(item);
    });
    function anchorOffset(group, item) {
      if (!group || group.length < 2) return 0;
      return (group.indexOf(item) - (group.length - 1) / 2) * 14;
    }
    visualEdges.forEach(function (item) {
      const edge = item.edge;
      const from = item.from;
      const to = item.to;
      if (edge.from_version === edge.to_version) return;
      const earlierRect = item.earlier.getBoundingClientRect();
      const laterRect = item.later.getBoundingClientRect();
      const x1 = earlierRect.right - gridRect.left + 1;
      const y1 = earlierRect.top - gridRect.top + earlierRect.height / 2 + anchorOffset(outgoing[item.startKey], item);
      const x2 = laterRect.left - gridRect.left - 1;
      const y2 = laterRect.top - gridRect.top + laterRect.height / 2 + anchorOffset(incoming[item.endKey], item);
      const dx = x2 - x1;
      const dy = y2 - y1;
      const length = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx) * 180 / Math.PI;
      const line = document.createElement('span');
      const isChanged = edge.relation === 'direct' && edge.from !== edge.to;
      line.className = 'path-edge ' + (isChanged ? 'changed' : 'continued');
      line.style.left = x1 + 'px';
      line.style.top = y1 + 'px';
      line.style.width = length + 'px';
      line.style.transform = 'rotate(' + angle + 'deg)';
      layer.appendChild(line);
    });
  }

  function renderTarget(result) {
    const mappings = result.target_results || [{
      target_year: result.target_year,
      target_label: result.target_label,
      target_codes: result.target_codes,
    }];
    targetResults.innerHTML = mappings.map(function (mapping) {
      const codes = mapping.target_codes.length
        ? mapping.target_codes.map(function (code) {
            return '<div class="target-code-pill">' + escapeHtml(code) + '</div>';
          }).join('')
        : '<div class="target-placeholder">该年份没有匹配代码</div>';
      return '<div class="target-result">'
        + '<div class="target-summary">'
        + '<div><span class="eyebrow">目标年份</span><strong>' + escapeHtml(mapping.target_year) + '</strong></div>'
        + '<div class="target-version-label">' + escapeHtml(mapping.target_label) + '</div>'
        + '</div>'
        + '<div class="target-code-list">' + codes + '</div>'
        + '</div>';
    }).join('');
  }

  async function convert() {
    formMessage.textContent = '';
    formMessage.className = 'form-message';
    setBusy(true);
    try {
      const response = await fetch('/api/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: codeInput.value,
          target_years: yearInput.value,
          source_version: 'AUTO',
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.error || '转换失败');
      window.__lastConversionResult = payload.result;
      renderPath(payload.result);
      renderTarget(payload.result);
      if (payload.result.source_version_inferred) {
        const candidates = payload.result.source_candidates.map(function (version) {
          return version.replace(/^H0$/, 'HS92').replace(/^H1$/, 'HS96').replace(/^H2$/, 'HS02').replace(/^H3$/, 'HS07').replace(/^H4$/, 'HS12').replace(/^H5$/, 'HS17').replace(/^H6$/, 'HS22');
        }).join('、');
        formMessage.className = 'form-message info';
        formMessage.textContent = '已自动识别来源版本：' + payload.result.source_label + '（候选范围：' + candidates + '）';
      } else {
        formMessage.className = 'form-message success';
        formMessage.textContent = '已完成转换。';
      }
    } catch (error) {
      formMessage.className = 'form-message error';
      formMessage.textContent = error.message;
    } finally {
      setBusy(false);
    }
  }

  convertButton.addEventListener('click', convert);
  window.addEventListener('resize', function () {
    const result = window.__lastConversionResult;
    if (result) requestAnimationFrame(function () { drawEdges(result); });
  });
  [codeInput, yearInput].forEach(function (element) {
    element.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') convert();
    });
  });

  if (new URLSearchParams(window.location.search).get('demo') === '1') {
    yearInput.value = '2005';
    convert();
  }
})();
