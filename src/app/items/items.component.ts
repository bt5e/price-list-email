import {Component, OnInit, ViewChild} from '@angular/core';
import {Observable} from "rxjs";
import {HttpClient} from '@angular/common/http';
import {MatPaginator} from "@angular/material/paginator";
import {MatTableDataSource} from "@angular/material/table";
import {saveAs} from 'file-saver';
import {MatDialog} from "@angular/material/dialog";
import {DialogAddItemComponent} from "../dialog-add-item/dialog-add-item.component";

@Component({
  selector: 'app-items',
  templateUrl: './items.component.html',
  styleUrls: ['./items.component.css']
})
export class ItemsComponent implements OnInit {
  displayedColumns: string[] = ['partNumber', 'description1', 'description2', 'pieceQty', 'bndlQty', 'liftQty', 'upcCode', 'actions'];
  selectedItemsDisplayedColumns: string[] = ['partNumber', 'description1', 'description2', 'upcCode', 'quantity', 'costCode', 'actions'];
  priceList: MatTableDataSource<any>;
  private selectedItems = [];
  selectedItemsDataSource: MatTableDataSource<any>;

  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;

  constructor(private httpClient: HttpClient,
              private dialog: MatDialog) {
  }

  ngOnInit() {
    this.loadData().subscribe(
      data => this.populateTableDataSource(data),
      error => console.log(error));
    this.selectedItemsDataSource = new MatTableDataSource(this.selectedItems);
  }

  private loadData(): Observable<any> {
    return this.httpClient.get("./assets/streamline-copper-tube.json");
  }

  private populateTableDataSource(data) {
    this.priceList = new MatTableDataSource(data);
    this.priceList.paginator = this.paginator;
  }

  applyFilter(filterValue: string) {
    this.priceList.filter = filterValue.trim().toLowerCase();
  }

  addItem(element: any) {
    const dialogRef = this.dialog.open(DialogAddItemComponent, {
      width: '250px',
      data: element
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed');
      if (result) {
        element.quantity = result.quantity;
        element.costCode = result.costCode;
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

  downloadEmail() {
    const fName = "order.eml";
    let orderContent = this.selectedItemsDataSource.data.map(entry => `<tr><td>${entry.partNumber}</td><td>${entry.description1}</td><td>${entry.description2}</td><td>${entry.upcCode}</td><td>${entry.quantity}</td><td>${entry.costCode}</td></tr>`).join('');

    let emailContent = "To: User <user@domain.demo>\n" +
      "Subject: Subject\n" +
      "X-Unsent: 1\n" +
      "Content-Type: text/html\n" +
      "\n" +
      "<html>" +
      "<head></head>" +
      "<body>" +
      "<table width=100% border=1><thead>" +
      "<th>Part Number</th>" +
      "<th>Description</th>" +
      "<th>Description</th>" +
      "<th>UPC Code</th>" +
      "<th>Quantity</th>" +
      "<th>Cost Code</th>" +
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
