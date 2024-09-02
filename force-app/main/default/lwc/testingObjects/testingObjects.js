import { LightningElement, track, api, wire } from 'lwc';

import getLabelAndData from '@salesforce/apex/TestingObjectHelper.getLabelAndData';

export default class TestingObjects extends LightningElement {    
    @api recordId;
    @api objectApiName;
    @api caseFieldsToInclude;
    @api accountFieldsToInclude;
    @api contactFieldsToInclude;
    @api sequenceOfFields;
    @api compoundFields;
    @track listOfCaseFields;
    @track listOfAccountFields;
    @track listOfContactFields;
    @track listOfSequenceOfFields;
    @track leftColumnData = [];
    @track rightColumnData = [];
    isError = false;
    errorMsg = '<strong><em>Unable to fetch the data. Please contact Your system admin.</em></strong>'

    connectedCallback(){
        if(this.caseFieldsToInclude){this.listOfCaseFields = this.caseFieldsToInclude.split(',');}
        if(this.accountFieldsToInclude){this.listOfAccountFields = this.accountFieldsToInclude.split(',').map(item => item.slice(8));}
        if(this.contactFieldsToInclude){this.listOfContactFields = this.contactFieldsToInclude.split(',').map(item => item.slice(8));}
        if(this.sequenceOfFields){this.listOfSequenceOfFields = this.sequenceOfFields.split(',');}
        if(this.compoundFields){this.compoundFields = new Set(this.compoundFields.split(','));}
    }

    @wire(getLabelAndData, {
        recordId: '$recordId', 
        objectApiName: '$objectApiName', 
        caseFieldsToInclude: '$caseFieldsToInclude', 
        listOfCaseFields: '$listOfCaseFields',
        accountFieldsToInclude: '$accountFieldsToInclude',
        listOfAccountFields: '$listOfAccountFields',
        contactFieldsToInclude: '$contactFieldsToInclude',
        listOfContactFields: '$listOfContactFields'
    })
    handleCaseData({data, error}){
        if(data){
            console.log('Data from wire - ', JSON.stringify(data));
            this.handleFormatting(data, Object.keys(data).length);
        }else if(error){
            this.isError = true;
            console.error(error);
        }
    }

    handleFormatting(data, noOfFields) {
        for (let index = 0; index < noOfFields; index++) {
            if(this.listOfSequenceOfFields){
                const fieldApiName = this.listOfSequenceOfFields[index];
                const fieldData = data[fieldApiName];
                console.log('in method - ', fieldApiName);
        
                if (fieldData) {
                    // Create a shallow copy of the field data object
                    const fieldDataCopy = { ...fieldData };
        
                    // Add the isAddress property to the copy
                    if (this.isAddressField(fieldApiName)) {
                        fieldDataCopy.isAddress = true;
                        fieldDataCopy.value = this.formatAddress(fieldDataCopy.value);
                    } else {
                        fieldDataCopy.isAddress = false;
                    }
        
                    // Push the processed field data to the appropriate column
                    if (index < noOfFields / 2) {
                        this.leftColumnData.push(fieldDataCopy);
                    } else {
                        this.rightColumnData.push(fieldDataCopy);
                    }
                }
            }
        }
    
        console.log('Left Column Data:', JSON.stringify(this.leftColumnData));
        console.log('Right Column Data:', JSON.stringify(this.rightColumnData));
    }
    

    isAddressField(fieldApiName) {
        // Add logic to identify address fields
        if(this.compoundFields){
            return this.compoundFields.has(fieldApiName); 
        }
        return false;
        // Example for BillingAddress
    }

    formatAddress(address) {
        // Assume address is a string with the format "Street, City, State, PostalCode, Country"
        const parts = address.split(',');
        return {
            street: parts[0]?.trim(),
            city: parts[1]?.trim(),
            country: parts[2]?.trim(),
            state: parts[3]?.trim(),
            postalCode: parts[4]?.trim()
        };
    }
    
}