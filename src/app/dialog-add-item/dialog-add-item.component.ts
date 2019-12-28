import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {FormControl, FormGroup} from "@angular/forms";

@Component({
  selector: 'app-dialog-add-item',
  templateUrl: './dialog-add-item.component.html',
  styleUrls: ['./dialog-add-item.component.css']
})
export class DialogAddItemComponent implements OnInit {
  form = new FormGroup({quantity: new FormControl(), unitOfMeasure: new FormControl()});
  input = {
    quantity: null,
    unitOfMeasure: null
  }

  constructor(
    public dialogRef: MatDialogRef<DialogAddItemComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
  }

  onSubmit(): void {
    const {value, valid} = this.form;
    if (valid) {
      this.input.quantity = this.form.get('quantity').value;
      this.input.unitOfMeasure = this.form.get('unitOfMeasure').value;
      this.dialogRef.close(this.input);
    }
  }

  ngOnInit() {
  }

}
