const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/* ---------- Mobile navigation ---------- */
const navToggle = $('#navToggle');
const mobileNav = $('#mobileNav');
navToggle?.addEventListener('click', () => {
  const open = mobileNav.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', String(open));
});
$$('a', mobileNav).forEach((a) => a.addEventListener('click', () => mobileNav.classList.remove('open')));

/* ---------- Catalogue filters (toy type + age group + "show more") ---------- */
const grid = $('#productGrid');
if (grid) {
  const cards = $$('.product-card', grid);
  const pageSize = Number(grid.dataset.pageSize) || 12;
  const state = { category: 'all', age: 'all', limit: pageSize };
  const countEl = $('#filterCount');
  const noResults = $('#noResults');
  const showMore = $('#showMore');

  const matches = (card) =>
    (state.category === 'all' || card.dataset.category === state.category) &&
    (state.age === 'all' || card.dataset.ages.split(' ').includes(state.age));

  function render() {
    const hit = cards.filter(matches);
    cards.forEach((c) => (c.hidden = true));
    hit.slice(0, state.limit).forEach((c) => (c.hidden = false));
    const shown = Math.min(hit.length, state.limit);
    countEl.textContent = hit.length ? `Showing ${shown} of ${hit.length} toys` : '';
    noResults.hidden = hit.length > 0;
    showMore.hidden = hit.length <= state.limit;
    $$('.filter-btn').forEach((b) => {
      const on = state[b.dataset.group] === b.dataset.value;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', String(on));
    });
  }

  function setFilter(group, value) {
    state[group] = value;
    state.limit = pageSize;
    render();
  }

  $('#filters').addEventListener('click', (e) => {
    const btn = e.target.closest('.filter-btn');
    if (btn) setFilter(btn.dataset.group, btn.dataset.value);
  });
  $('#filterReset').addEventListener('click', () => {
    state.category = 'all';
    state.age = 'all';
    state.limit = pageSize;
    render();
  });
  showMore.addEventListener('click', () => {
    state.limit += pageSize;
    render();
  });
  // "View … toys" buttons on the category cards pre-select that toy type.
  $$('[data-filter-link]').forEach((a) =>
    a.addEventListener('click', () => setFilter('category', a.dataset.filterLink))
  );
  render();
}

/* ---------- Enquiry form ---------- */
const form = $('#enquiryForm');
const fields = $('#formFields');
const success = $('#formSuccess');
const errorBox = $('#formError');
const submitBtn = $('#formSubmit');
const chatPanel = $('#chatPanel');

if (form) $('#fstarted').value = String(Date.now());

/** Take the visitor to the form with their product / topic pre-filled. */
function openEnquiry(topic, category) {
  const interest = $('#finterest');
  if (category) {
    const match = [...interest.options].find((o) => o.value.toLowerCase().startsWith(categoryShort(category)));
    if (match) interest.value = match.value;
  }
  const msg = $('#fmessage');
  if (!msg.value.trim()) msg.value = `I'm interested in: ${topic}`;
  fields.hidden = false;
  success.hidden = true;
  chatPanel?.classList.remove('open');
  $('#contact').scrollIntoView({ behavior: 'smooth', block: 'start' });
  setTimeout(() => $('#fname').focus({ preventScroll: true }), 500);
}
const categoryShort = (id) => ({ battery: 'battery', rc: 'remote', friction: 'friction' })[id] ?? id;

$$('.js-enquire').forEach((b) =>
  b.addEventListener('click', () => openEnquiry(b.dataset.product, b.dataset.category))
);

function whatsappText(data) {
  return [
    "Hi, I'd like to place a bulk enquiry.",
    '',
    `Name: ${data.get('name')}`,
    `Business: ${data.get('business')}`,
    `Phone: ${data.get('phone')}`,
    `Toy type: ${data.get('interest')}`,
    `Age group: ${data.get('age')}`,
    data.get('message') ? `Message: ${data.get('message')}` : '',
  ]
    .filter((l, i, a) => l !== '' || a[i - 1] !== '')
    .join('\n');
}

function showError(html) {
  errorBox.innerHTML = html;
  errorBox.hidden = false;
  errorBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorBox.hidden = true;
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }
  const data = new FormData(form);
  const label = $('span', submitBtn);
  submitBtn.disabled = true;
  label.textContent = 'Sending…';
  try {
    const res = await fetch(form.dataset.endpoint, {
      method: 'POST',
      body: data,
      headers: { Accept: 'application/json' },
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.ok) throw new Error(json.error || 'Request failed');
    $('#successWa').href = `${form.dataset.waBase}?text=${encodeURIComponent(whatsappText(data))}`;
    fields.hidden = true;
    success.hidden = false;
    success.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } catch (err) {
    const wa = `${form.dataset.waBase}?text=${encodeURIComponent(whatsappText(data))}`;
    showError(
      `We couldn't send your enquiry just now. Please try again, or <a href="${wa}" target="_blank" rel="noopener">send it on WhatsApp instead</a>.`
    );
  } finally {
    submitBtn.disabled = false;
    label.textContent = 'Send Enquiry';
  }
});

$('#formResetBtn')?.addEventListener('click', () => {
  form.reset();
  $('#fstarted').value = String(Date.now());
  success.hidden = true;
  fields.hidden = false;
});

/* ---------- Chat widget ---------- */
const chatToggle = $('#chatToggle');
chatToggle?.addEventListener('click', () => {
  const open = chatPanel.classList.toggle('open');
  chatToggle.setAttribute('aria-expanded', String(open));
});
$('#chatClose')?.addEventListener('click', () => {
  chatPanel.classList.remove('open');
  chatToggle.setAttribute('aria-expanded', 'false');
});
$$('[data-chat-topic]').forEach((b) => b.addEventListener('click', () => openEnquiry(b.dataset.chatTopic)));
$('#chatForm')?.addEventListener('submit', (e) => {
  e.preventDefault();
  const input = $('#chatInput');
  const value = input.value.trim();
  if (!value) return;
  openEnquiry(value);
  input.value = '';
});

/* ---------- Photo lightbox ---------- */
const lightbox = $('#lightbox');
if (lightbox) {
  const img = $('#lightboxImg');
  const close = () => lightbox.classList.remove('open');
  $$('.gallery-item[data-full]').forEach((b) =>
    b.addEventListener('click', () => {
      img.src = b.dataset.full;
      img.alt = $('img', b).alt;
      lightbox.classList.add('open');
    })
  );
  lightbox.addEventListener('click', (e) => e.target !== img && close());
  document.addEventListener('keydown', (e) => e.key === 'Escape' && close());
}

/* ---------- YouTube click-to-play (loads the player only on demand) ---------- */
$$('.video-frame[data-youtube]').forEach((frame) => {
  $('.video-play', frame).addEventListener('click', () => {
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube-nocookie.com/embed/${frame.dataset.youtube}?autoplay=1&rel=0`;
    iframe.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    iframe.allowFullscreen = true;
    iframe.title = 'Kiddo World video';
    frame.replaceChildren(iframe);
  });
});
