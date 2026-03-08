// ─────────────────────────────────────────────
//  Submission form logic — submit.html
// ─────────────────────────────────────────────

const db = getSupabase();

const form          = document.getElementById('blessForm');
const successMsg    = document.getElementById('successMessage');
const submitBtn     = document.getElementById('submitBtn');
const submitText    = document.getElementById('submitText');
const submitLoading = document.getElementById('submitLoading');
const formError     = document.getElementById('formError');
const textarea      = document.getElementById('blessing');
const charCount     = document.getElementById('charCount');
const photoInput    = document.getElementById('photo');
const photoPreview  = document.getElementById('photoPreview');
const photoDropUI   = document.getElementById('photoDropUI');

// ── Character counter ──────────────────────────
textarea.addEventListener('input', () => {
  charCount.textContent = textarea.value.length;
});

// ── Photo preview ──────────────────────────────
photoInput.addEventListener('change', () => {
  const file = photoInput.files[0];
  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    showError('Photo must be under 5 MB.');
    photoInput.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    photoPreview.src = e.target.result;
    photoPreview.style.display = 'block';
    photoDropUI.style.display  = 'none';
  };
  reader.readAsDataURL(file);
});

// ── Form submit ────────────────────────────────
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearError();
  setLoading(true);

  const name         = document.getElementById('name').value.trim();
  const relationship = document.getElementById('relationship').value.trim();
  const blessing     = textarea.value.trim();
  const photoFile    = photoInput.files[0] || null;

  let photo_url = null;

  try {
    // 1. Upload photo if provided
    if (photoFile) {
      photo_url = await uploadPhoto(photoFile);
    }

    // 2. Insert blessing row
    const { error } = await db.from('blessings').insert([{
      name,
      relationship: relationship || null,
      blessing,
      photo_url,
    }]);

    if (error) throw error;

    // 3. Show success
    form.style.display = 'none';
    successMsg.style.display = 'flex';

  } catch (err) {
    console.error(err);
    showError('Something went wrong — please try again. (' + err.message + ')');
  } finally {
    setLoading(false);
  }
});

// ── Upload helper ──────────────────────────────
async function uploadPhoto(file) {
  const ext      = file.name.split('.').pop();
  const filename = `blessing-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await db.storage
    .from('photos')
    .upload(filename, file, { cacheControl: '3600', upsert: false });

  if (error) throw error;

  const { data } = db.storage.from('photos').getPublicUrl(filename);
  return data.publicUrl;
}

// ── UI helpers ─────────────────────────────────
function setLoading(on) {
  submitBtn.disabled      = on;
  submitText.style.display    = on ? 'none'   : 'inline';
  submitLoading.style.display = on ? 'inline' : 'none';
}

function showError(msg) {
  formError.textContent    = msg;
  formError.style.display  = 'block';
}

function clearError() {
  formError.textContent   = '';
  formError.style.display = 'none';
}
