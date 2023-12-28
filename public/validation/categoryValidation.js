const catInput = document.getElementById('newCatName');
const catInputModal = document.getElementById('catName');

function validateCategory() {
  const newName = document.getElementById('newCatName').value.trim().toUpperCase();

  if (newName.length === 0) {
    catInput.placeholder = 'Category required';
    catInput.style.borderColor = 'red';
    catInput.style.textDecorationColor = 'red';
    document.getElementById('catErr').innerText = 'Category required';
    return false;
  }

  return true;
}

function validateModalCategory() {
  const newName = document.getElementById('catName').value.trim().toUpperCase();

  if (newName.length === 0) {
    catInputModal.placeholder = 'Category required';
    catInputModal.style.borderColor = 'red';
    catInputModal.style.textDecorationColor = 'red';
    document.getElementById('catErr').innerText = 'Category required';
    return false;
  }

  return true;
}


