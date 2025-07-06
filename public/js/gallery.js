// gallery.js
function openModal(src) { 
  const modal = document.getElementById("modal");
  const modalImg = document.getElementById("modal-img");
  modal.style.display = "flex";
  modalImg.src = src;
}

function closeModal() {
  document.getElementById("modal").style.display = "none";
}

window.addEventListener('DOMContentLoaded', async () => {
  const galleryGrid = document.querySelector('.gallery-grid');
  if (!galleryGrid) return;

  try {
    const response = await fetch('/api/artworks');
    const data = await response.json();

    if (data.success) {
      data.artworks.forEach(art => {
        const artDiv = document.createElement('div');
        artDiv.classList.add('art-card');
        artDiv.innerHTML = `
          <img src="${art.imagePath}" alt="${art.title}" onclick="openModal('${art.imagePath}')">
          <h3>${art.title}</h3>
          <p><strong>Artist:</strong> ${art.artist || 'Unknown'}</p>
          <p>${art.description}</p>
          ${art.isOwner ? `<button onclick="deleteArtwork('${art._id}', this)">Delete</button>` : ''}
        `;
        galleryGrid.appendChild(artDiv);
      });
    } else {
      galleryGrid.innerHTML = '<p>Failed to load artworks.</p>';
    }
  } catch (error) {
    console.error('Error loading artworks:', error);
    galleryGrid.innerHTML = '<p>Error loading artworks.</p>';
  }
});
async function deleteArtwork(id, btn) {
  if (!confirm('Are you sure you want to delete this artwork?')) return;

  try {
    const res = await fetch(`/api/artworks/${id}`, { method: 'DELETE' });
    const result = await res.json();

    if (result.success) {
      btn.closest('.art-card').remove();
      alert('Artwork deleted!');
    } else {
      alert('Failed to delete artwork.');
    }
  } catch (error) {
    console.error('Error deleting artwork:', error);
    alert('Error occurred while deleting artwork.');
  }
}
