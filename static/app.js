(function () {
  const codeInput = document.getElementById('hs-code');
  const yearInput = document.getElementById('target-year');
  const hsCodeFile = document.getElementById('hs-code-file');
  const convertButton = document.getElementById('convert-button');
  const exportButton = document.getElementById('export-button');
  const formMessage = document.getElementById('form-message');
  const pathTable = document.getElementById('path-table');
  const targetResults = document.getElementById('target-results');
  const targetPageSize = 3;
  let targetPage = 1;
  let targetPageCount = 1;
  let targetCodeResults = [];

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, function (character) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character];
    });
  }

  function setBusy(isBusy) {
    convertButton.disabled = isBusy;
    convertButton.querySelector('span:not(.button-glyph)').textContent = isBusy ? '正在转换…' : '开始转换';
    convertButton.querySelector('.button-glyph').textContent = isBusy ? '↻' : '▶';
  }

  function appendCodes(codes) {
    const existing = codeInput.value.trim();
    const uploaded = codes.join(' ');
    codeInput.value = existing ? existing + ' ' + uploaded : uploaded;
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
    const results = (result.results || [result]).slice(0, 1);
    pathTable.innerHTML = results.map(function (pathResult, pathIndex) {
      const columns = pathResult.versions.map(function (version) {
        const codes = version.codes.length
          ? '<div class="code-stack">' + version.codes.map(function (code) {
              return '<div class="code-pill ' + edgeClass(pathResult, version.key, code) + '" data-version-key="' + escapeHtml(version.key) + '" data-code="' + escapeHtml(code) + '">' + escapeHtml(code) + '</div>';
            }).join('') + '</div>'
          : '<div class="code-stack"><div class="path-empty">无对应代码</div></div>';
        return '<div class="version-column">' + codes + '</div>';
      }).join('');
      const timeline = pathResult.versions.map(function (version, index) {
        const arrow = index < pathResult.versions.length - 1 ? '<span class="timeline-arrow" aria-hidden="true"></span>' : '';
        return '<div class="timeline-item"><span>HS ' + escapeHtml(version.release_year) + '</span></div>' + arrow;
      }).join('');
      return '<div class="path-result">'
        + '<div class="path-visualizer" data-path-index="' + pathIndex + '"><div class="path-grid">' + columns + '<div class="edge-layer" aria-hidden="true"></div></div><div class="path-timeline">' + timeline + '</div></div>'
        + '</div>';
    }).join('');
    requestAnimationFrame(function () {
      pathTable.querySelectorAll('.path-visualizer').forEach(function (visualizer, index) {
        drawEdges(results[index], visualizer);
      });
    });
  }

  function drawEdges(result, visualizer) {
    const grid = visualizer.querySelector('.path-grid');
    const layer = visualizer.querySelector('.edge-layer');
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
    targetCodeResults = result.results || [result];
    targetPageCount = Math.max(1, Math.ceil(targetCodeResults.length / targetPageSize));
    targetPage = Math.min(targetPage, targetPageCount);
    const pageStart = (targetPage - 1) * targetPageSize;
    const codeResults = targetCodeResults.slice(pageStart, pageStart + targetPageSize);
    const firstMappings = targetCodeResults[0] && (targetCodeResults[0].target_results || [{
      target_year: targetCodeResults[0].target_year,
      target_label: targetCodeResults[0].target_label,
      target_codes: targetCodeResults[0].target_codes,
    }]);
    const yearColumns = (firstMappings || []).map(function (mapping) {
      return { year: mapping.target_year, label: mapping.target_label };
    });
    const headerHtml = yearColumns.map(function (column) {
      return '<th scope="col"><span class="target-year-heading">' + escapeHtml(column.year) + '</span>'
        + '<span class="target-version-heading">' + escapeHtml(column.label) + '</span></th>';
    }).join('');
    const rowHtml = codeResults.map(function (codeResult) {
      const mappings = codeResult.target_results || [{
        target_year: codeResult.target_year,
        target_label: codeResult.target_label,
        target_codes: codeResult.target_codes,
      }];
      const mappingsByYear = {};
      mappings.forEach(function (mapping) { mappingsByYear[String(mapping.target_year)] = mapping; });
      const cells = yearColumns.map(function (column) {
        const mapping = mappingsByYear[String(column.year)];
        const codes = mapping && mapping.target_codes && mapping.target_codes.length
          ? '<div class="target-table-code-stack">' + mapping.target_codes.map(function (code) {
              return '<span class="target-code-pill">' + escapeHtml(code) + '</span>';
            }).join('') + '</div>'
          : '<span class="target-table-empty">—</span>';
        return '<td>' + codes + '</td>';
      }).join('');
      return '<tr><th scope="row" class="target-input-code">' + escapeHtml(codeResult.input_code) + '</th>' + cells + '</tr>';
    }).join('');
    const resultHtml = '<div class="target-table-wrapper"><table class="target-mapping-table">'
      + '<thead><tr><th scope="col" class="target-input-heading">输入 HSCode</th>' + headerHtml + '</tr></thead>'
      + '<tbody>' + rowHtml + '</tbody>'
      + '</table></div>';
    const paginationHtml = targetPageCount > 1
      ? '<div class="target-pagination" aria-label="目标年份结果分页">'
        + '<button type="button" class="pagination-button" data-page-action="previous"' + (targetPage === 1 ? ' disabled' : '') + '>上一页</button>'
        + '<label class="pagination-jump">第 <input class="pagination-input" type="number" min="1" max="' + targetPageCount + '" value="' + targetPage + '" aria-label="跳转页码"> / ' + targetPageCount + ' 页</label>'
        + '<button type="button" class="pagination-button" data-page-action="next"' + (targetPage === targetPageCount ? ' disabled' : '') + '>下一页</button>'
        + '</div>'
      : '';
    targetResults.innerHTML = resultHtml + paginationHtml;
  }

  function goToTargetPage(page) {
    const nextPage = Number.parseInt(page, 10);
    if (!Number.isFinite(nextPage)) return;
    targetPage = Math.max(1, Math.min(targetPageCount, nextPage));
    renderTarget({ results: targetCodeResults });
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
          codes: codeInput.value,
          target_years: yearInput.value,
          source_version: 'AUTO',
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.error || '转换失败');
      window.__lastConversionResult = payload.result;
      exportButton.disabled = false;
      renderPath(payload.result);
      targetPage = 1;
      renderTarget(payload.result);
      formMessage.className = 'form-message success';
      formMessage.textContent = '已完成转换。';
    } catch (error) {
      formMessage.className = 'form-message error';
      formMessage.textContent = error.message;
    } finally {
      setBusy(false);
    }
  }

  function downloadFilename(response) {
    const disposition = response.headers.get('Content-Disposition') || '';
    const encoded = disposition.match(/filename\*=UTF-8''([^;]+)/i);
    if (encoded) return decodeURIComponent(encoded[1]);
    const plain = disposition.match(/filename="?([^";]+)"?/i);
    return plain ? plain[1] : 'HS_Code_映射结果.xlsx';
  }

  async function exportExcel() {
    if (!window.__lastConversionResult) return;
    exportButton.disabled = true;
    exportButton.textContent = '正在导出…';
    try {
      const response = await fetch('/api/export-excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codes: codeInput.value,
          target_years: yearInput.value,
          source_version: 'AUTO',
        }),
      });
      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error || '导出失败');
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = downloadFilename(response);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      formMessage.className = 'form-message success';
      formMessage.textContent = 'Excel 已导出。';
    } catch (error) {
      formMessage.className = 'form-message error';
      formMessage.textContent = error.message;
    } finally {
      exportButton.disabled = false;
      exportButton.textContent = '导出excel';
    }
  }

  convertButton.addEventListener('click', convert);
  exportButton.addEventListener('click', exportExcel);
  targetResults.addEventListener('click', function (event) {
    const button = event.target.closest('[data-page-action]');
    if (!button || button.disabled) return;
    goToTargetPage(targetPage + (button.dataset.pageAction === 'next' ? 1 : -1));
  });
  targetResults.addEventListener('change', function (event) {
    if (event.target.matches('.pagination-input')) goToTargetPage(event.target.value);
  });
  targetResults.addEventListener('keydown', function (event) {
    if (event.key === 'Enter' && event.target.matches('.pagination-input')) {
      event.preventDefault();
      goToTargetPage(event.target.value);
    }
  });
  window.addEventListener('resize', function () {
    const result = window.__lastConversionResult;
    if (result) {
      const results = (result.results || [result]).slice(0, 1);
      requestAnimationFrame(function () {
        pathTable.querySelectorAll('.path-visualizer').forEach(function (visualizer, index) {
          drawEdges(results[index], visualizer);
        });
      });
    }
  });
  [codeInput, yearInput].forEach(function (element) {
    element.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') convert();
    });
  });

  hsCodeFile.addEventListener('change', async function () {
    const file = this.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    const uploadButton = this.closest('.upload-code-button');
    uploadButton.classList.add('is-uploading');
    try {
      const response = await fetch('/api/upload-hscodes', { method: 'POST', body: formData });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.error || '文件处理失败');
      appendCodes(payload.codes);
      formMessage.className = 'form-message success';
      formMessage.textContent = '已导入 ' + payload.codes.length + ' 个 HS Code';
    } catch (error) {
      formMessage.className = 'form-message error';
      formMessage.textContent = error.message;
    } finally {
      uploadButton.classList.remove('is-uploading');
      this.value = '';
    }
  });

  if (new URLSearchParams(window.location.search).get('demo') === '1') {
    yearInput.value = '2005';
    convert();
  }
})();
