/* =========================================================
   Student Registration Form - script.js
   Concepts used: addEventListener, submit event, event object,
   preventDefault, trim, validation, error messages,
   classList.add / remove / toggle, data-* + dataset,
   attribute manipulation, password confirmation,
   success message, reset.
   ========================================================= */

// ---------- 1. Grab the main elements ----------
const form = document.getElementById("registrationForm");
const successBox = document.getElementById("successMessage");
const address = document.getElementById("address");
const addressCounter = document.getElementById("addressCounter");

// Becomes true after the first submit attempt, so errors only
// start updating live once the user has tried to submit.
let hasSubmitted = false;

// ---------- 2. Small helper functions ----------

// Returns the element that should get the red .error styling.
// Radio groups use the <fieldset>; the checkbox uses its <label>.
function getFieldElement(name) {
  if (name === "gender") return document.getElementById("gender");
  if (name === "agreement") return document.getElementById("agreement").closest("label");
  return document.getElementById(name);
}

// Returns the element that receives keyboard focus when invalid.
function getFocusElement(name) {
  if (name === "gender") return document.querySelector('input[name="gender"]');
  return document.getElementById(name);
}

// trim() the field's value and write the cleaned text back into the input.
function cleanValue(id) {
  const input = document.getElementById(id);
  input.value = input.value.trim();
  return input.value;
}

// Reads the friendly name from data-label (uses dataset).
function labelOf(id) {
  return document.getElementById(id).dataset.label;
}

// ---------- 3. Show / clear errors (classList.add / classList.remove) ----------
function setError(name, message) {
  const fieldEl = getFieldElement(name);
  const errorEl = document.getElementById(name + "-error");

  fieldEl.classList.add("error");          // red highlight
  errorEl.textContent = message;           // specific message under the field
  document.getElementById(name).setAttribute("aria-invalid", "true");
}

function clearError(name) {
  const fieldEl = getFieldElement(name);
  const errorEl = document.getElementById(name + "-error");

  fieldEl.classList.remove("error");       // remove highlight once corrected
  errorEl.textContent = "";
  document.getElementById(name).removeAttribute("aria-invalid");
}

// ---------- 4. One validator per field ----------
// Each returns an error message string, or "" when the value is valid.
const validators = {
  studentId() {
    const value = cleanValue("studentId");
    if (value === "") return labelOf("studentId") + " is required.";
    if (!/^\d{4}-\d{5}$/.test(value)) {
      return document.getElementById("studentId").dataset.hint;
    }
    return "";
  },

  fullName() {
    // trim() plus collapse repeated spaces inside the name
    const input = document.getElementById("fullName");
    input.value = input.value.trim().replace(/\s+/g, " ");
    const value = input.value;

    if (value === "") return "Full name is required.";
    if (!/^[A-Za-z][A-Za-z.'-]*(\s[A-Za-z.'-]+)+$/.test(value)) {
      return "Enter your first and last name using letters only.";
    }
    return "";
  },

  email() {
    const value = cleanValue("email");
    if (value === "") return "Email is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
      return "Enter a valid email address, like juan@school.edu.ph.";
    }
    return "";
  },

  phone() {
    // Remove spaces and dashes so "0917 123 4567" is accepted
    const input = document.getElementById("phone");
    input.value = input.value.trim().replace(/[\s-]/g, "");
    const value = input.value;

    if (value === "") return "Phone number is required.";
    if (!/^09\d{9}$/.test(value)) return input.dataset.hint;
    return "";
  },

  dob() {
    const input = document.getElementById("dob");
    const value = input.value;
    if (value === "") return "Date of birth is required.";

    const birth = new Date(value);
    const today = new Date();
    if (birth > today) return "Date of birth cannot be in the future.";

    // Work out the age and compare it with data-min-age
    let age = today.getFullYear() - birth.getFullYear();
    const hadBirthday =
      today.getMonth() > birth.getMonth() ||
      (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate());
    if (!hadBirthday) age--;

    const minAge = Number(input.dataset.minAge);
    if (age < minAge) return "You must be at least " + minAge + " years old to register.";
    return "";
  },

  gender() {
    const chosen = document.querySelector('input[name="gender"]:checked');
    return chosen ? "" : "Please select a gender.";
  },

  program() {
    return document.getElementById("program").value === "" ? "Please select a program." : "";
  },

  yearLevel() {
    return document.getElementById("yearLevel").value === "" ? "Please select a year level." : "";
  },

  password() {
    // Passwords are NOT trimmed (spaces are rejected instead)
    const value = document.getElementById("password").value;
    if (value === "") return "Password is required.";
    if (/\s/.test(value)) return "Password must not contain spaces.";
    if (value.length < 8) return "Password must be at least 8 characters long.";
    if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) {
      return "Password must include at least one letter and one number.";
    }
    return "";
  },

  confirmPassword() {
    const confirm = document.getElementById("confirmPassword").value;
    const password = document.getElementById("password").value;
    if (confirm === "") return "Please confirm your password.";
    if (confirm !== password) return "Passwords do not match.";
    return "";
  },

  address() {
    const value = cleanValue("address");
    const limit = Number(address.dataset.limit);
    if (value === "") return "Address is required.";
    if (value.length < 10) return "Please enter a complete address (at least 10 characters).";
    if (value.length > limit) return "Address must be " + limit + " characters or fewer.";
    return "";
  },

  agreement() {
    return document.getElementById("agreement").checked
      ? ""
      : "You must agree before you can register.";
  }
};

// Validate one field and show or clear its error. Returns true if valid.
function validateField(name) {
  const message = validators[name]();
  if (message) {
    setError(name, message);
    return false;
  }
  clearError(name);
  return true;
}

// ---------- 5. Form submission (submit event + event object) ----------
form.addEventListener("submit", function (event) {
  // Stop the browser from submitting/reloading the page
  event.preventDefault();

  hasSubmitted = true;
  hideSuccess();

  let firstInvalid = null;

  // Check every field (no early exit) so ALL errors show at once
  Object.keys(validators).forEach(function (name) {
    const isValid = validateField(name);
    if (!isValid && firstInvalid === null) firstInvalid = name;
  });

  if (firstInvalid !== null) {
    form.dataset.status = "error";               // attribute manipulation (data-status)
    getFocusElement(firstInvalid).focus();       // jump to the first problem
    return;
  }

  // All fields valid: show success and make sure no errors remain
  form.dataset.status = "success";
  showSuccess();
});

// ---------- 6. Success message ----------
function showSuccess() {
  const name = document.getElementById("fullName").value;
  const id = document.getElementById("studentId").value;
  const programSelect = document.getElementById("program");
  const programName = programSelect.options[programSelect.selectedIndex].text;

  successBox.textContent =
    "Registration successful! " + name + " (" + id + ") is now registered for " + programName + ".";
  successBox.hidden = false;
  successBox.scrollIntoView({ behavior: "smooth", block: "center" });
}

function hideSuccess() {
  successBox.hidden = true;
  successBox.textContent = "";
}

// ---------- 7. Live correction: errors disappear as the user fixes them ----------
function handleFieldChange(event) {
  const target = event.target;               // the element that changed
  const name = target.name;

  // Editing after a successful registration makes that result outdated
  if (form.dataset.status === "success") {
    form.dataset.status = "idle";
    hideSuccess();
  }

  if (!hasSubmitted || !validators[name]) return;
  validateField(name);

  // If the password changes, the confirmation may now match (or stop matching)
  if (name === "password" && document.getElementById("confirmPassword").value !== "") {
    validateField("confirmPassword");
  }
}
form.addEventListener("input", handleFieldChange);
form.addEventListener("change", handleFieldChange);

// ---------- 8. Show / Hide password (classList.toggle + attribute change) ----------
function setPasswordVisibility(button, visible) {
  const input = document.getElementById(button.dataset.target); // data-target via dataset

  button.classList.toggle("is-visible", visible);
  // The "type" attribute decides whether the characters are masked
  input.setAttribute("type", visible ? "text" : "password");

  button.textContent = visible ? "Hide" : "Show";
  button.setAttribute("aria-pressed", String(visible));
  button.setAttribute(
    "aria-label",
    (visible ? "Hide " : "Show ") + input.dataset.label.toLowerCase()
  );
}

document.querySelectorAll(".toggle-btn").forEach(function (button) {
  button.addEventListener("click", function () {
    const willShow = !button.classList.contains("is-visible");
    setPasswordVisibility(button, willShow);
  });
});

// ---------- 9. Address character counter ----------
// Uses data-limit to set the real maxlength attribute and warn near the limit.
address.setAttribute("maxlength", address.dataset.limit);

function updateCounter() {
  const limit = Number(address.dataset.limit);
  const length = address.value.length;
  addressCounter.textContent = length + " / " + limit;
  addressCounter.classList.toggle("limit-near", length >= limit * 0.9);
}
address.addEventListener("input", updateCounter);

// ---------- 10. Reset: return everything to its original state ----------
form.addEventListener("reset", function () {
  hasSubmitted = false;
  hideSuccess();
  form.dataset.status = "idle";

  // Remove all error messages and error styling
  Object.keys(validators).forEach(clearError);

  // Hide both passwords again
  document.querySelectorAll(".toggle-btn").forEach(function (button) {
    setPasswordVisibility(button, false);
  });

  // The browser clears the fields AFTER this event, so update the counter right after
  setTimeout(updateCounter, 0);
});

updateCounter();