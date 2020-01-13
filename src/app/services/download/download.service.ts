import {Injectable} from '@angular/core';
import {saveAs} from 'file-saver';
import * as XLSX from 'xlsx';

@Injectable({
  providedIn: 'root'
})
export class DownloadService {
  private excelExportColumns: string[] = ['quantity', 'unitOfMeasure', 'costCode', 'type', 'size', 'extendedSize', 'description', 'manufacturer', 'modelSerialPartNumber', 'vendor'];

  constructor() {
  }


  downloadExcel(data: any[]) {
    const fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data, {header: this.excelExportColumns});
    const wb: XLSX.WorkBook = {Sheets: {'data': ws}, SheetNames: ['data']};
    const wsCols = [{wch: 8}, {wch: 10}, {wch: 10}, {wch: 10}, {wch: 10}, {wch: 30}, {wch: 15}, {wch: 15}, {wch: 10}, {wch: 15}, {wch: 20},];
    ws['!cols'] = wsCols;

    const excelBuffer: any = XLSX.write(wb, {bookType: 'xlsx', type: 'array'});
    const excelFile: Blob = new Blob([excelBuffer], {type: fileType});
    saveAs(excelFile, "order.xlsx");
  }

  downloadEmail(data: any[]) {
    const fName = "order.eml";
    let orderContent = data.map(entry => `
<tr>
<td>${entry.quantity}</td>
<td>${entry.unitOfMeasure}</td>
<td>${entry.costCode}</td>
<td>${entry.type}</td>
<td>${entry.size}</td>
<td>${entry.extendedSize}</td>
<td>${entry.description}</td>
<td>${entry.manufacturer}</td>
<td>${entry.modelSerialPartNumber}</td>
<td>${entry.vendor}</td>
</tr>`).join('');

    let emailContent = "To: jwildasin@shapiroandduncan.com\n" +
      "Cc: rchurchey@shapiroandduncan.com; bcampbell@shapiroandduncan.com; nlowe@shapiroandduncan.com; ptse@shapiroandduncan.com\n" +
      "Subject: 1770 Crystal Drive Material Request <Beta Test>\n" +
      "X-Unsent: 1\n" +
      "Content-Type: text/html\n" +
      "\n" +
      "<html>" +
      "<head></head>" +
      "<body>" +
      "<table width=100% border=1><thead>" +
      "<th>Quantity</th>" +
      "<th>Unit of Measure</th>" +
      "<th>Cost Code</th>" +
      "<th>Type</th>" +
      "<th>Size</th>" +
      "<th>Extended Size</th>" +
      "<th>Description</th>" +
      "<th>Manufacturer</th>" +
      "<th>Model/Serial/Part#</th>" +
      "<th>Vendor</th>" +
      "</thead>" +
      "<tbody>" +
      orderContent +
      "</tbody></table>" +
      "</body>" +
      "</html>";
    const blob = new Blob([emailContent], {type: "message/rfc822;charset=utf-8"});
    saveAs(blob, fName);
  }
}
