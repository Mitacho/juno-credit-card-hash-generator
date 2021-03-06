const submitButtonEl = document.getElementById("submit-button");
const submitButtonSpinnerEl = document.getElementById("submit-button__spinner");
const submitButtonTextEl = document.getElementById("submit-button__text");
const creditCardFormEl = document.getElementById("credit-card__form");
const hashSpanEl = document.getElementById("hash");
const errorFieldEl = document.getElementById("error-field");
const infoFieldEl = document.getElementById("info-field");
const publicKeyInputEl = document.getElementById("public-key");
const sandboxCheckboxEl = document.getElementById("sandbox");
const mainHeaderEl = document.getElementById("main-header");
const notificationEl = document.getElementById("notification");
const publicKeyErrorField = document.getElementById("public-key-error-field");

let notifications = 1;
let publicKey = "";
let sandbox = true;
let checkout = null;

publicKeyInputEl.value = publicKey;
// sandboxCheckboxEl.checked = sandbox;
publicKeyErrorField.innerHTML = "você precisa informar uma chave pública";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toggleModal(id) {
  const modal = document.getElementById(id);

  const isMounted = modal.classList.contains("mount");

  if (isMounted) {
    modal.classList.remove("mount");
    modal.classList.add("unmount");
  } else {
    modal.classList.remove("unmount");
    modal.classList.add("mount");
  }
}

function updateNotifications() {
  if (notifications === 0) {
    notificationEl.classList.remove("notification");
  } else {
    notificationEl.classList.add("notification");
  }

  notificationEl.setAttribute("data-content", notifications);
}

function updatePublicKey(key, sandbox) {
  /* Em sandbox utilizar o construtor new DirectCheckout('PUBLIC_TOKEN', false); */
  checkout = sandbox ? new DirectCheckout(key, false) : new DirectCheckout(key);
  publicKey = key;
  updateNotifications();
}

function onUpdatePublicKey(el) {
  const key = el.value;
  const keyNotUpdated = key === publicKey;

  notifications = notifications > 0 ? notifications : notifications + 1;

  if (key === "") {
    updateNotifications();
    publicKeyErrorField.removeAttribute("hidden");
    publicKeyErrorField.innerHTML = "você precisa informar uma chave pública";
    return;
  } else if (key.length < 50) {
    updateNotifications();
    publicKeyErrorField.removeAttribute("hidden");
    publicKeyErrorField.innerHTML =
      "você precisa informar uma chave pública válida";
    return;
  }

  if (keyNotUpdated) {
    return;
  }

  notifications -= 1;
  publicKeyErrorField.setAttribute("hidden", "");

  updatePublicKey(key, sandbox);
}

function onUpdateSandbox() {
  sandbox = !sandbox;
  updatePublicKey(publicKey, sandbox);
}

function copyToClipboard() {
  navigator.clipboard.writeText(hashSpanEl.innerText);

  infoFieldEl.removeAttribute("hidden");
  infoFieldEl.innerHTML = "hash copiado!";

  setTimeout(() => {
    infoFieldEl.setAttribute("hidden", "");
    infoFieldEl.innerHTML = "";
  }, 3000);
}

function formElementState(state) {
  switch (state) {
    case "reset":
      submitButtonSpinnerEl.setAttribute("hidden", "");
      submitButtonTextEl.removeAttribute("hidden");
      submitButtonEl.removeAttribute("disabled");
      break;
    case "submitting":
      submitButtonSpinnerEl.removeAttribute("hidden");
      submitButtonTextEl.setAttribute("hidden", "");
      submitButtonEl.setAttribute("disabled", "");
      hashSpanEl.setAttribute("hidden", "");
      errorFieldEl.setAttribute("hidden", "");
      break;
    default:
      break;
  }
}

function handleFormSubmit(e) {
  e.preventDefault();

  if (!checkout) {
    errorFieldEl.removeAttribute("hidden");
    errorFieldEl.innerHTML = "Você precisa informar uma chave pública válida";

    return;
  }

  formElementState("submitting");

  const formData = new FormData(e.target);
  let {
    cardNumber,
    holderName,
    securityCode,
    expirationMonth,
    expirationYear,
  } = Object.fromEntries(formData);

  console.log(
    cardNumber,
    holderName,
    securityCode,
    expirationMonth,
    expirationYear
  );

  cardNumber = cardNumber.replace(/\s/g, "");

  generateHash({
    cardNumber,
    holderName,
    securityCode,
    expirationMonth,
    expirationYear,
  });
}

function generateHash(cardData) {
  /* getCardType: Obtem o tipo de cartão de crédito (bandeira) */
  checkout.getCardType(cardData.cardNumber);

  checkout.getCardHash(
    cardData,
    function (cardHash) {
      console.log(cardHash);
      formElementState("reset");

      hashSpanEl.innerHTML = cardHash;
      hashSpanEl.removeAttribute("hidden");
      /* Sucesso - A variável cardHash conterá o hash do cartão de crédito */
    },
    function (error) {
      formElementState("reset");

      errorFieldEl.removeAttribute("hidden");
      errorFieldEl.innerHTML = error.message;

      console.error(error);
      /* Erro - A variável error conterá o erro ocorrido ao obter o hash */
    }
  );
}
