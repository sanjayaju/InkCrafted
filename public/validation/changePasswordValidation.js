const oldPasswordError = document.getElementById("oldPasswordErr")
const newPasswordError = document.getElementById("newPasswordErr")
const conformPasswordError = document.getElementById("conformPasswordErr")

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/


function validatePassword(){

    let oldPassword = document.getElementById("oldPassword").value.trim()
    let newPassword = document.getElementById("newPassword").value.trim()
    let conformPassword = document.getElementById("confromPassword").value.trim()

    if(oldPassword.length === 0){
        oldPasswordError.innerHTML = "Enter Password!";
        return false;
    }else if(oldPassword.lengt< 8){
        oldPasswordError.innerHTML  = "Password must constain 8 characters"
        return false;   
    }else if(!oldPassword.match(passwordRegex)){
        oldPasswordError.innerHTML - "Invalid Password";
        return false;
    }else{
        oldPasswordError.innerHTML = '';
    }
    if(newPassword.length === 0){
        newPasswordError.innerHTML = "Enter Password!";
        return false;
    }else if(newPassword.length === 0){
        newPasswordError.innerHTML = "Enter password!";
        return false;
    }else if(newPassword.length < 8){
        newPasswordError.innerHTML = "Password must contain 8 characters";
        return false;
    }else if(!newPassword.match(passwordRegex)){
        newPasswordError.innerHTML = "Invalid Password";
        return false;
    }else{
        newPasswordError.innerHTML = "";
    }
if(conformPassword.length === 0){
    conformPasswordError.innerHTML = "Enter Password!";
    return false;
}else if (conformPassword.length < 8){
    conformPasswordError.innerHTML = "Password must contain 8 characters";
    return false;
}else if(newPassword !== conformPassword){
    conformPasswordError.innerHTML = "Password not  matching";
    return false;
}else{
    conformPasswordError.innerHTML = "";
}
return true;
}