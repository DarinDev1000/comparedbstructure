
function runShowButton() {
  console.log("button");
  const currentDisplaySetting = document.getElementById("formArea").style.display;
  if (currentDisplaySetting === "flex") {
    document.getElementById("formArea").style.display = "none";
    document.getElementById("hideButton").innerHTML = "Show Setup"
  }
  else {
    document.getElementById("formArea").style.display = "flex";
    document.getElementById("hideButton").innerHTML = "Hide Setup"
  }

}

function submitForm() {
  console.log("Submitting Form");
  const db1_url = document.getElementById("db1_url").value;
  const db1_port = document.getElementById("db1_port").value;
  const db1_dbName = document.getElementById("db1_dbName").value;
  const db1_username = document.getElementById("db1_username").value;
  const db1_password = document.getElementById("db1_password").value;

  console.log(db1_url);
}

