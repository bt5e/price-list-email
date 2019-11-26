import {Component, OnInit, ViewChild} from '@angular/core';
import {Observable} from "rxjs";
import {HttpClient} from '@angular/common/http';
import {MatPaginator} from "@angular/material/paginator";
import {MatTableDataSource} from "@angular/material/table";
import {saveAs} from 'file-saver';
import * as XLSX from 'xlsx';
import {MatDialog} from "@angular/material/dialog";
import {DialogAddItemComponent} from "../dialog-add-item/dialog-add-item.component";

@Component({
  selector: 'app-items',
  templateUrl: './items.component.html',
  styleUrls: ['./items.component.css']
})
export class ItemsComponent implements OnInit {
  displayedColumns: string[] = ['service', 'costCode', 'type', 'size', 'extendedSize', 'description', 'manufacturer', 'modelSerialPartNumber', 'vendor', 'actions'];
  selectedItemsDisplayedColumns: string[] = ['quantity', 'costCode', 'type', 'size', 'extendedSize', 'description', 'manufacturer', 'modelSerialPartNumber', 'vendor', 'actions'];
  excelExportColumns: string[] = ['quantity', 'costCode', 'type', 'size', 'extendedSize', 'description', 'manufacturer', 'modelSerialPartNumber', 'vendor'];
  services: string[] = ['', 'CONSUMABLES - GENERAL CONDITIONS', 'UNDERGROUND PLUMBING', 'ABOVEGROUND WASTE & VENT'];
  materialList: MatTableDataSource<any>;
  selectedItemsDataSource = new MatTableDataSource<any>();

  filterValues = {
    service: '',
    text: '',
  };

  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;

  constructor(private httpClient: HttpClient,
              private dialog: MatDialog) {
  }

  ngOnInit() {
    this.loadData().subscribe(
      data => this.populateTableDataSource(data),
      error => console.log(error));
  }

  private loadData(): Observable<any> {
    return this.httpClient.get("./assets/data.json");
  }

  private populateTableDataSource(data) {
    this.materialList = new MatTableDataSource(data);
    this.materialList.paginator = this.paginator;
    this.materialList.filterPredicate = this.tableFilter();
  }

  tableFilter(): (data: any, filter: string) => boolean {
    let filterFunction = function (data, filter): boolean {
      let searchTerms = JSON.parse(filter);
      return data.service.indexOf(searchTerms.service) !== -1
        && (
          data.costCode.toString().toLowerCase().indexOf(searchTerms.text) !== -1 ||
          data.type.toString().toLowerCase().indexOf(searchTerms.text) !== -1 ||
          data.size.toString().toLowerCase().indexOf(searchTerms.text) !== -1 ||
          data.extendedSize.toString().toLowerCase().indexOf(searchTerms.text) !== -1 ||
          data.description.toString().toLowerCase().indexOf(searchTerms.text) !== -1 ||
          data.manufacturer.toString().toLowerCase().indexOf(searchTerms.text) !== -1 ||
          data.modelSerialPartNumber.toString().toLowerCase().indexOf(searchTerms.text) !== -1 ||
          data.vendor.toString().toLowerCase().indexOf(searchTerms.text) !== -1
        );
    }
    return filterFunction;
  }

  applyTextFilter(filterValue: string) {
    this.filterValues.text = filterValue.trim().toLowerCase();
    this.materialList.filter = JSON.stringify(this.filterValues);
  }

  applyServiceFilter(filterValue: string) {
    this.filterValues.service = filterValue.trim();
    this.materialList.filter = JSON.stringify(this.filterValues);
  }

  addItem(element: any) {
    const dialogRef = this.dialog.open(DialogAddItemComponent, {
      width: '250px',
      data: element
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        element.quantity = result.quantity;
        this.selectedItemsDataSource.data.push(element);
        this.selectedItemsDataSource._updateChangeSubscription();
      }
    });
  }

  removeItem(element: any) {
    const index = this.selectedItemsDataSource.data.indexOf(element, 0);
    if (index > -1) {
      this.selectedItemsDataSource.data.splice(index, 1);
    }
    this.selectedItemsDataSource._updateChangeSubscription();
  }

  downloadExcel() {
    const fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.selectedItemsDataSource.data, {header: this.excelExportColumns});
    const wb: XLSX.WorkBook = {Sheets: {'data': ws}, SheetNames: ['data']};
    const excelBuffer: any = XLSX.write(wb, {bookType: 'xlsx', type: 'array'});
    const data: Blob = new Blob([excelBuffer], {type: fileType});
    saveAs(data, "order.xlsx");
  }

  downloadEmail() {
    const fName = "order.eml";
    let orderContent = this.selectedItemsDataSource.data.map(entry => `
<tr>
<td>${entry.quantity}</td>
<td>${entry.costCode}</td>
<td>${entry.type}</td>
<td>${entry.size}</td>
<td>${entry.extendedSize}</td>
<td>${entry.description}</td>
<td>${entry.manufacturer}</td>
<td>${entry.modelSerialPartNumber}</td>
<td>${entry.vendor}</td>
</tr>`).join('');

    let emailContent = "To: User <user@domain.demo>\n" +
      "Subject: Subject\n" +
      "X-Unsent: 1\n" +
      "Content-Type: text/html\n" +
      "\n" +
      "<html>" +
      "<head></head>" +
      "<body>" +
      "<table width=100% border=1><thead>" +
      "<th>Quantity</th>" +
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
