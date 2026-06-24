function validateEmail(input:string):boolean{
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(input);
}

document.addEventListener('DOMContentLoaded', () => {
    const emailInput:HTMLInputElement = document.getElementById('email') as HTMLInputElement;
    const emailError:HTMLSpanElement = document.getElementById('email-error') as HTMLSpanElement;
    const otpSendBtn:HTMLButtonElement = document.getElementById('send-code') as HTMLButtonElement;
    const otpSection:HTMLDivElement = document.getElementById('otp') as HTMLDivElement;
    const otpInput:HTMLInputElement = document.getElementById('otp-input') as HTMLInputElement;
    const submitBtn:HTMLButtonElement = document.getElementById('submit') as HTMLButtonElement;

    emailInput.addEventListener('input', () => {
        if(!validateEmail(emailInput.value) && emailInput.value){
            emailError.innerHTML = "Please enter a valid email address<br><br>";
            otpSendBtn.disabled = true;
            console.log("A");
        }else if(emailInput.value){
            otpSendBtn.disabled = false;
            console.log("B");
        }else{
            emailError.innerHTML = "";
            otpSendBtn.disabled = true;
            console.log("C");
        }
    });

    otpSendBtn.addEventListener("click", async() => {
        otpSendBtn.disabled = true;
        otpSendBtn.innerHTML = "Sending...";
        const email = emailInput.value.trim().toLowerCase();

        if(!validateEmail(email)){
            alert("Please enter a valid email address.");
            otpSendBtn.disabled = false;
            return;
        }

        try{
            const response = await fetch("https://voterid.astr.ac/nrc-email-check", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: email
                })
            });

            const data = await response.json();

            if(!data.ok){
                alert(data.error || "Unable to send verification code");
                otpSendBtn.disabled = true;
                return;
            }

            otpSection.style.display = "block";
            otpSendBtn.style.display = "none";
        }catch(err){
            console.log(err);
            alert(`Unable to verify email address
${err}`);
        }
    });

    submitBtn.addEventListener("click", async() => {
        const email = emailInput.value.trim().toLowerCase();
        const code = otpInput.value.trim().toLowerCase();

        if(!/^\d{6}$/.test(email)){
            alert("Please enter a 6-digit OTP code");
            return;
        }

        submitBtn.disabled = true;
        submitBtn.innerHTML = "Sending...";
    });
})