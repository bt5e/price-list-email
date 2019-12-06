import {Component, OnInit, ViewChild} from '@angular/core';
import {Observable} from "rxjs";
import {HttpClient} from '@angular/common/http';
import {MatPaginator} from "@angular/material/paginator";
import {MatTableDataSource} from "@angular/material/table";
import {MatDialog} from "@angular/material/dialog";
import {DialogAddItemComponent} from "../dialog-add-item/dialog-add-item.component";
import {MatSelect} from "@angular/material/select";
import {FormControl} from "@angular/forms";
import {map, startWith} from "rxjs/operators";
import {BreakpointObserver, Breakpoints} from '@angular/cdk/layout';
import {DownloadService} from "../services/download/download.service";

@Component({
  selector: 'app-items',
  templateUrl: './items.component.html',
  styleUrls: ['./items.component.css']
})
export class ItemsComponent implements OnInit {
  materialTableColumnsAll: string[] = ['service', 'costCode', 'type', 'size', 'extendedSize', 'description', 'manufacturer', 'modelSerialPartNumber', 'vendor', 'actions'];
  materialTableColumnsSmallDevices: string[] = ['consolidatedColumn'];
  materialTableColumns: string[] = this.materialTableColumnsAll;
  materialOrderTableColumnsAll: string[] = ['quantity', 'costCode', 'type', 'size', 'extendedSize', 'description', 'manufacturer', 'modelSerialPartNumber', 'vendor', 'actions'];
  materialOrderTableColumnsSmallDevices: string[] = ['consolidatedColumn'];
  materialOrderTableColumns: string[] = this.materialOrderTableColumnsAll;

  serviceFilterControl = new FormControl();
  serviceOptions: string[];
  filteredServiceOptions: Observable<string[]>;

  typeFilterControl = new FormControl();
  typeOptions: string[];
  filteredTypeOptions: Observable<string[]>;

  sizeFilterControl = new FormControl();
  sizeOptions: string[]
  filteredSizeOptions: Observable<string[]>;

  materialList: MatTableDataSource<any>;
  selectedItemsDataSource = new MatTableDataSource<any>();

  filterValues = {
    service: '',
    type: '',
    size: '',
    text: '',
  };
  @ViewChild('serviceFilterSelect', {static: true}) serviceFilterSelect: MatSelect;

  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;

  constructor(private httpClient: HttpClient,
              private breakpointObserver: BreakpointObserver,
              private downloadService: DownloadService,
              private dialog: MatDialog) {
    breakpointObserver.observe([
      Breakpoints.XSmall,
      Breakpoints.Small,
    ]).subscribe(result => {
        if (result.matches) this.activateHandsetPortraitLayout()
      }
    );
  }

  ngOnInit() {
    this.loadData().subscribe(
      data => this.populateTableDataSource(data),
      error => console.log(error));
  }

  private loadData(): Observable<any> {
    return this.httpClient.get("./assets/data.json");
  }

  private populateTableDataSource(data: []) {
    this.materialList = new MatTableDataSource(data);
    this.materialList.paginator = this.paginator;
    this.materialList.filterPredicate = this.tableFilter();
    this.updateFilterDropDownSelections(data);
  }

  private updateFilterDropDownSelections(data: any[]) {
    this.sizeOptions = this.createDropDownSelectionsFromRaw(data.map(value => value['size']));
    this.filteredSizeOptions = this.sizeFilterControl.valueChanges
      .pipe(
        startWith(''),
        map(value => this.sizeOptions.filter(option => option.toLowerCase().includes(value.toLowerCase())))
      );

    this.typeOptions = this.createDropDownSelectionsFromRaw(data.map(value => value['type']));
    this.filteredTypeOptions = this.typeFilterControl.valueChanges
      .pipe(
        startWith(''),
        map(value => this.typeOptions.filter(option => option.toLowerCase().includes(value.toLowerCase())))
      );

    this.serviceOptions = this.createDropDownSelectionsFromRaw(data.map(value => value['service']));
    this.filteredServiceOptions = this.serviceFilterControl.valueChanges
      .pipe(
        startWith(''),
        map(value => this.serviceOptions.filter(option => option.toLowerCase().includes(value.toLowerCase())))
      );
  }

  private createDropDownSelectionsFromRaw(rawList: any[]): any[] {
    let dropDownSelections = rawList
      .filter((value, index, array) => array.indexOf(value) === index)
      .filter(value => value !== '');
    dropDownSelections.push(''); // blank selection
    dropDownSelections.sort();
    return dropDownSelections;
  }

  tableFilter(): (data: any, filter: string) => boolean {
    let filterFunction = function (data, filter): boolean {
      let searchTerms = JSON.parse(filter);

      let searchTextTokens = searchTerms.text ? searchTerms.text.toString().split(' ') : [];

      function isSearchTextTokensInFields(fieldValues: any[]): boolean {
        for (let token of searchTextTokens) {
          if (fieldValues.map(value => value.toString().toLowerCase()).join(' ').indexOf(token) === -1)
            return false;
        }
        return true;
      }

      return (searchTerms.service ? data.service === searchTerms.service : true) &&
        (searchTerms.type ? data.type === searchTerms.type : true) &&
        (searchTerms.size ? data.size === searchTerms.size : true) &&
        (searchTerms.text ? (
            isSearchTextTokensInFields([
              data.costCode,
              data.type,
              data.extendedSize,
              data.description,
              data.manufacturer,
              data.modelSerialPartNumber,
              data.vendor])) : true
        );
    }
    return filterFunction;
  }

  resetFilters() {
    this.filterValues.service = '';
    this.filterValues.size = '';
    this.filterValues.text = '';
    this.materialList.filter = null;
    this.updateFilterDropDownSelections(this.materialList.filteredData);
  }

  applyTextFilter(filterValue: string) {
    this.filterValues.text = filterValue.trim().toLowerCase();
    this.materialList.filter = JSON.stringify(this.filterValues);
    this.updateFilterDropDownSelections(this.materialList.filteredData);
  }

  applyTypeFilter(filterValue: string) {
    this.filterValues.type = filterValue.trim();
    this.materialList.filter = JSON.stringify(this.filterValues);
    this.updateFilterDropDownSelections(this.materialList.filteredData);
  }

  applyServiceFilter(filterValue: string) {
    this.filterValues.service = filterValue.trim();
    this.materialList.filter = JSON.stringify(this.filterValues);
    this.updateFilterDropDownSelections(this.materialList.filteredData);
  }

  applySizeFilter(filterValue: string) {
    this.filterValues.size = filterValue.trim();
    this.materialList.filter = JSON.stringify(this.filterValues);
    this.updateFilterDropDownSelections(this.materialList.filteredData);
  }

  addItem(element: any) {
    const dialogRef = this.dialog.open(DialogAddItemComponent, {
      width: '250px',
      data: element
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const newElement = {...element};
        newElement.quantity = result.quantity;
        this.selectedItemsDataSource.data.push(newElement);
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
    this.downloadService.downloadEmail(this.selectedItemsDataSource.data);
  }

  downloadExcel() {
    this.downloadService.downloadExcel(this.selectedItemsDataSource.data);
  }

  private activateHandsetPortraitLayout() {
    this.materialTableColumns = this.materialTableColumnsSmallDevices;
    this.materialOrderTableColumns = this.materialOrderTableColumnsSmallDevices;
  }
}
