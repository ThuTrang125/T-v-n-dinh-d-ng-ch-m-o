// This script is designed to be deployed as a Google Apps Script Web App.
// It receives data from an HTML form submission and logs it to a Google Sheet.

function doPost(e) {
  try {
    // Log the received parameters for debugging
    Logger.log('Received POST request with parameters: ' + JSON.stringify(e.parameter));

    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Ecopets AI Leads');
    if (!sheet) {
      sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet('Ecopets AI Leads');
    }

    var headers = [
      'Timestamp', 
      'Loại Yêu Cầu', 
      'Tên Khách Hàng', 
      'Số Điện Thoại', 
      'Địa Chỉ', 
      'Thông Tin Thú Cưng', 
      'Phân Tích Của AI', 
      'Tư Vấn Dinh Dưỡng', 
      'Tư Vấn Hành Vi', 
      'Tư Vấn Kết Nối', 
      'Sản Phẩm Đề Xuất', 
      'Tổng Tiền'
    ];

    // If the sheet is empty, add the header row
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(headers);
    }

    // Extract data from the request parameters
    var data = e.parameter;
    
    // FIX: Correctly map the camelCase form data keys to the sheet columns.
    // The original logic was flawed as it tried to use Vietnamese headers as keys.
    var newRow = [
      new Date(),               // Timestamp
      data.type || '',          // Loại Yêu Cầu
      data.userName || '',      // Tên Khách Hàng
      data.userPhone || '',     // Số Điện Thoại
      data.userAddress || '',   // Địa Chỉ
      data.petInfo || '',       // Thông Tin Thú Cưng
      data.aiAnalysis || '',    // Phân Tích Của AI
      data.aiNutrition || '',   // Tư Vấn Dinh Dưỡng
      data.aiBehavior || '',    // Tư Vấn Hành Vi
      data.aiConnection || '',  // Tư Vấn Kết Nối
      data.aiProducts || '',    // Sản Phẩm Đề Xuất
      data.totalCost || ''      // Tổng Tiền
    ];

    sheet.appendRow(newRow);

    // Return a simple success response. This is mainly for debugging.
    return ContentService.createTextOutput("Success")
      .setMimeType(ContentService.MimeType.TEXT);

  } catch (error) {
    Logger.log('Error in doPost: ' + error.toString());
    
    // Return an error response
    return ContentService.createTextOutput("Error: " + error.toString())
      .setMimeType(ContentService.MimeType.TEXT);
  }
}
