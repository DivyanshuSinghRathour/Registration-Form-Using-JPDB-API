
var jpdbBaseURL = "http://api.login2explore.com:5577";
var jpdbIRL = "/api/irl";
var jpbdIML = "/api/iml";
var employeeDatabaseName = "Employee-Database";
var employeeRelationName = "Register_Employee";
var connectionToken = "90931264|-31949327670408770|90961030";

$("#empId").focus();

//Function for return alter HTML code according to status of response
function alertHandlerHTML(status, message) {
    // 1--> Success , 0--> Warning

    if (status === 1) {
        return `<div class="alert  alert-primary d-flex align-items-center alert-dismissible " role="alert">
                <svg class="bi flex-shrink-0 me-2" width="24" height="24" role="img" aria-label="Info:"><use xlink:href="#info-fill"/></svg>
                <div>
                <strong>Success!</strong> ${message}
                </div>
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>`;
    } else {
        return `<div class="alert  alert-warning d-flex align-items-center alert-dismissible" role="alert">
        <svg class="bi flex-shrink-0 me-2" width="24" height="24" role="img" aria-label="Warning:"><use xlink:href="#exclamation-triangle-fill"/></svg>
        <div>
        <strong>Warning!</strong> ${message}
        </div>
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>`;
    }
}

////Function for append alter message into alter div
function alertHandler(status, message) {
    var alterHTML = alertHandlerHTML(status, message);
    let alertDiv = document.createElement("div");
    alertDiv.innerHTML = alterHTML;
    $("#disposalAlertContainer").append(alertDiv);
}

// Function for save record number into localstorage
function saveRecNoToLocalStorage(jsonObject) {
    var lvData = JSON.parse(jsonObject.data);
    localStorage.setItem("recordNo", lvData.rec_no);
}

// Function for disable all element on page except id input feild
function disableAllFeildExceptEmpId() {
    $("#empName").prop("disabled", true);
    $("#empEmail").prop("disabled", true);
    $("#empSalary").prop("disabled", true);
    $("#empLocation").prop("disabled", true);
    $('#reset').prop('disabled', true);
    $('#save').prop('disabled', true);
    $('#change').prop('disabled', true);
}

//Function for reset form data and disable all other feild except id
function resetForm() {
    $("#empId").val("");
    $("#empName").val("");
    $("#empEmail").val("");
    $("#empSalary").val("");
    $("#empLocation").val("");
    $("#empId").prop("disabled", false);
    disableAllFeildExceptEmpId();
    $("#empId").focus();
}

//Function for fill data if Employee already is present in database
function fillData(jsonObject) {
    if (jsonObject === "") {
        $("#empName").val("");
        $("#empEmail").val("");
        $("#empSalary").val("");
        $("#empLocation").val("");
    } else {

        // Employee record number saved to localstorage
        saveRecNoToLocalStorage(jsonObject);

        // parse json object into JSON
        var data = JSON.parse(jsonObject.data).record;

        $("#empName").val(data.empName);
        $("#empEmail").val(data.empEmail);
        $("#empSalary").val(data.empSalary);
        $("#empLocation").val(data.empLocation);
        }
}

//Function to check validity of user input data
function validateFormData() {
    var empId, empName, empEmail, empSalary, empLocation;
    empId = $("#empId").val();
    empName = $("#empName").val();
    empEmail = $("#empEmail").val();
    empSalary = $("#empSalary").val();
    empLocation = $("#empLocation").val();

    if (empId === '') {
        alertHandler(0, "Emp Id Missing");
        $("#empId").focus();
        return "";
    }

    if (empId <= 0) {
        alertHandler(0, "Invalid Id");
        $("#empId").focus();
        return "";
    }

    if (empName === '') {
        alertHandler(0, "Name Is Missing");
        $("#empName").focus();
        return "";
    }

    if (empEmail === "") {
        alertHandler(0, "Email Is Missing");
        $("#empEmail").focus();
        return "";
    }
    if (empLocation === "") {
        alertHandler(0, "Location Is Missing");
        $("#empLocation").focus();
        return "";
    }
    if (empSalary === '') {
        alertHandler(0, "Salary Is Missing");
        $("#empSalary").focus();
        return "";
    }

    // if data is valid then create a JSON object otherwise return empty string( which denote that data is not valid )
    var jsonStrObj = {
        empId: empId,
        empName: empName,
        empEmail: empEmail,
        empSalary: empSalary,
        empLocation: empLocation
    };
    
    //Convert JSON object into string 
    return JSON.stringify(jsonStrObj);
}
//Function to return stringified JSON object whcih contain emp id of emp
function getEmpIdAsJsonObj() {
    var empId = $("#empId").val();
    var jsonStr = {
        empId: empId

    };
    return JSON.stringify(jsonStr);
}

// Function to query details of existing emp
function getEmployeeData() {
    if ($("#empId").val() === "") {
        // if ID is not given then disable all feild
        disableAllFeildExceptEmpId();
    } else if ($("#empId").val() < 1) {
        // if ID is not valid (i.e id <1)
        disableAllFeildExceptEmpId();
        alertHandler(0, "Invalid Emp Id");
        $("#empId").focus();
    } else {
        // if id is valid
        var employeIdJsonObj = getEmpIdAsJsonObj();
        // create GET Request object
        var getRequest = createGET_BY_KEYRequest(
            connectionToken,
            employeeDatabaseName,
            employeeRelationName,
            employeIdJsonObj
        );

        jQuery.ajaxSetup({ async: false });
        // make GET request
        var resJsonObj = executeCommandAtGivenBaseUrl(
            getRequest,
            jpdbBaseURL,
            jpdbIRL
        );
        jQuery.ajaxSetup({ async: true });

        // Enable all feild
        $("#empId").prop("disabled", false);
        $("#empName").prop("disabled", false);
        $("#empEmail").prop("disabled", false);
        $("#empSalary").prop("disabled", false);
        $("#empLocation").prop("disabled", false);

        if (resJsonObj.status === 400) {
            // if Employee is not exist already with same ID then enable save and reset btn
            $("#reset").prop("disabled", false);
            $("#save").prop("disabled", false);
            $("#change").prop("disabled", true);
            fillData("");
            $("#empName").focus();
        } else if (resJsonObj.status === 200) {
            // if Employee is exist already with same ID then enable update and reset btn
            $("#empId").prop("disabled", true);
            fillData(resJsonObj);
            $("#reset").prop("disabled", false);
            $("#change").prop("disabled", false);
            $("#save").prop("disabled", true);
            $("#EmpName").focus();
        }
    }
}

//Function to make PUT request to save data into database
function saveData() {
    var jsonStrObj = validateFormData();

    // If form data is not valid
    if (jsonStrObj === "") return "";

    // create PUT Request object
    var putRequest = createPUTRequest(
        connectionToken,
        jsonStrObj,
        employeeDatabaseName,
        employeeRelationName
    );
    jQuery.ajaxSetup({ async: false });

    //Make PUT Request for saving data into database
    var resJsonObj = executeCommandAtGivenBaseUrl(
        putRequest,
        jpdbBaseURL,
        jpbdIML
    );
    jQuery.ajaxSetup({ async: true });

    if (resJsonObj.status === 400) {
        // If data is not saved
        alertHandler(
            0,
            "Data Is Not Saved ( Message: " + resJsonObj.message + " )"
        );
    } else if (resJsonObj.status === 200) {
        // If data is successfully saved
        alertHandler(1, "Data Saved successfully");
    }
    //After saving to databse resent from data
    resetForm();

    $("#empId").focus();
}

//Function used to make UPDATE Request
function changeData() {
    $("#change").prop("disabled", true);
    var jsonChg = validateFormData(); // Before making UPDATE Request validate form data

    // Create UPDATE Request object
    var updateRequest = createUPDATERecordRequest(
        connectionToken,
        jsonChg,
        employeeDatabaseName,
        employeeRelationName,
        localStorage.getItem("recordNo")
    );
    jQuery.ajaxSetup({ async: false });

    //Make UPDATE Request
    var resJsonObj = executeCommandAtGivenBaseUrl(
        updateRequest,
        jpdbBaseURL,
        jpbdIML
    );
    jQuery.ajaxSetup({ async: true });

    if (resJsonObj.status === 400) {
        // If data is not saved
        alertHandler(
            0,
            "Data Is Not Update ( Message: " + resJsonObj.message + " )"
        );
    } else if (resJsonObj.status === 200) {
        // If data is successfully saved
        alertHandler(1, "Data Update successfully");
    }

    //After updating to databse resent from data
    resetForm();
    $("#empId").focus();
}
