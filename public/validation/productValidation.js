const brandErr =  document.getElementById('brandErr')
const nameErr =  document.getElementById('nameErr')
const descriptionErr = document.getElementById('descriptionErr')
const blueInkCheckbox = document.getElementById('blueInkCheckbox')
const blackInkCheckbox = document.getElementById('blackInkCheckbox')
const quantiyErr = document.getElementById('quantiyErr')
const priceErr =  document.getElementById('priceErr')
const imageErr = document.getElementById('imageErr')


function validateBrand(){
    const brand = document.getElementById('brand').value.trim();
    if(brand.length ===0){
        brandErr.innerHTML = 'Brand Name Required';
        return false
        }else{
            brandErr.innerHTML = ''
        }
        return true;
}


function validateName(){
    const name  = document.getElementById('name').value.trim()

    if(name.length === 0){
        nameErr.innerHTML = 'Product Name Required ';
        return false
    }else{
        nameErr.innerHTML = ''
    }

    return true;
}

function validateDescription() {
    const description = document.getElementById('description').value.trim();
    if (description.length === 0) {
        descriptionErr.innerHTML = 'Description Required';
        return false;
    } else {
        descriptionErr.innerHTML = '';
        return true;
    }
}

// function validateSelectedInkColors() {
    
//     if (!blueInkCheckbox.checked && !blackInkCheckbox.checked) {
//         // If neither checkbox is checked, display an error message
//         console.error('Please select at least one ink color.');
//         return false; // Validation failed
//     }

//     // Validation successful
//     return true;
// }

function validateQuantity(){
    const quantity = document.getElementById('quantity').value.trim()

    if(quantity <=0){
        quantiyErr.innerHTML = 'Quantity Required';
        return false
    }else if(quantity > 1000){
        quantiyErr.innerHTML = 'Qunatity must be less than 1000';
        return false
    }else{
        quantiyErr.innerHTML = ''
    }
    return true;
}

function validateprice(){
    const price = document.getElementById('price').value.trim()

    if(price <=0){
        priceErr.innerHTML = 'price cannot be a negative number or zero'
    }else if(price <500){
        priceErr.innerHTML = 'price must be greater than 500';
        return false
    }else if(price > 10000){
        priceErr.innerHTML = 'price must be less than 10000';
        return false
    }else{
        priceErr.innerHTML =''
    }
    return true;
}

 
function validateImage(){
    return true;
}
function validateProduct() {
    const brandValid = validateBrand();
    const nameValid = validateName();
    const descriptionValid = validateDescription();
    const quantityValid = validateQuantity();
    const priceValid = validateprice();
    const InkColorValid = validateInkColor(); // Add this line

    return brandValid && nameValid && descriptionValid && quantityValid && priceValid && InkColorValid;
}

function validateInkColor() {
    const InkColor = document.getElementById('InkColor').value.trim();

    if (InkColor.length === 0) {
        // Display an error message or take appropriate action
        console.error('Ink Color Required');
        return false;
    }

    // Validation successful
    return true;
}
