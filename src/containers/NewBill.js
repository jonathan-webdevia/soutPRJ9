import { ROUTES_PATH } from "../constants/routes.js";
import Logout from "./Logout.js";

export default class NewBill {
  constructor({ document, onNavigate, store, localStorage }) {
    this.document = document;
    this.onNavigate = onNavigate;
    this.store = store;
    const formNewBill = this.document.querySelector(
      `form[data-testid="form-new-bill"]`
    );
    formNewBill.addEventListener("submit", this.handleSubmit);
    const file = this.document.querySelector(`input[data-testid="file"]`);
    file.addEventListener("change", this.handleChangeFile);
    this.fileUrl = null;
    this.fileName = null;
    this.billId = null;
    new Logout({ document, localStorage, onNavigate });
  }

  handleChangeFile = (e) => {
    e.preventDefault();
    const file = this.document.querySelector(`input[data-testid="file"]`)
      .files[0];
    const fileName = file.name;

    const acceptedFormat = ["jpg", "jpeg", "png"];
    // img var checker
    const fileInput = this.document.querySelector(`input[data-testid="file"]`);
    const fileNameParts = fileName.split(".");
    const fileExtension = fileNameParts[fileNameParts.length - 1].toLowerCase();

    // init boolean ig checker
    this.validImgFormat = false;

    // Check if image format is .jpg, jpeg or png - if true set validImgFormat to true else false
    acceptedFormat.indexOf(fileExtension) !== -1
      ? (this.validImgFormat = true)
      : (this.validImgFormat = false);

    if (!this.validImgFormat) {
      // unaccepted format ?
      fileInput.value = ""; // clean the input
      fileInput.classList.add("is-invalid"); // add a class to add an error
      fileInput.classList.remove("blue-border");
      alert(
        "Votre fichier ne correspondant pas aux attentes..." +
          "\n" +
          "Seuls les fichiers au format .jpg, .jpeg, .png sont acceptés."
      ); // Error message in an alert popup
    } else {
      fileInput.classList.remove("is-invalid"); 
      fileInput.classList.add("blue-border");
      const formData = new FormData();
      const email = JSON.parse(localStorage.getItem("user")).email;
      formData.append("file", file);
      formData.append("email", email);
      this.formData = formData;
      this.fileName = fileName;
    }
  };

  handleSubmit = (e) => {
    e.preventDefault();
    console.log(
      'e.target.querySelector(`input[data-testid="datepicker"]`).value',
      e.target.querySelector(`input[data-testid="datepicker"]`).value
    );
    const email = JSON.parse(localStorage.getItem("user")).email;
    const bill = {
      email,
      type: e.target.querySelector(`select[data-testid="expense-type"]`).value,
      name: e.target.querySelector(`input[data-testid="expense-name"]`).value,
      amount: parseInt(
        e.target.querySelector(`input[data-testid="amount"]`).value
      ),
      date: e.target.querySelector(`input[data-testid="datepicker"]`).value,
      vat: e.target.querySelector(`input[data-testid="vat"]`).value,
      pct:
        parseInt(e.target.querySelector(`input[data-testid="pct"]`).value) ||
        20,
      commentary: e.target.querySelector(`textarea[data-testid="commentary"]`)
        .value,
      fileUrl: this.fileUrl,
      fileName: this.fileName,
      status: "pending",
    };
    if (this.validImgFormat) {
      // if image format is valid ...
      // ... move in handleSubmit to upload image and create new bill only when image format is valid and form is complete
      this.store
        .bills()
        .create({
          data: this.formData,
          headers: {
            noContentType: true,
          },
        })
        .then(({ fileUrl, key }) => {
          console.log(fileUrl);
          this.billId = key;
          this.fileUrl = fileUrl;
        })
        .then(() => {
          this.updateBill(bill);
        })
        .catch((error) => console.error(error));
    }
  };

  updateBill = (bill) => {
    if (this.store) {
      this.store
        .bills()
        .update({ data: JSON.stringify(bill), selector: this.billId })
        .then(() => {
          this.onNavigate(ROUTES_PATH["Bills"]);
        })
        .catch((error) => console.error(error));
    }
  };
}
