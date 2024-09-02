public class TestingObjectHelper {
	@AuraEnabled(Cacheable=true)
    public static Map<String, Map<String, String>> getLabelAndData(Id recordId, String objectApiName, 
                                                                   String caseFieldsToInclude, List<String> listOfCaseFields, 
                                                                   String accountFieldsToInclude, List<String> listOfAccountFields, 
                                                                   String contactFieldsToInclude, List<String> listOfContactFields)
    {    
        if(objectApiName == 'Investigation__c'){
            Investigation__c inv = [select is_case__c from Investigation__c where id =: recordId limit 1];
            recordId = inv.is_case__c;
            objectApiName = 'Case';
        }
        String query = 'select ' + caseFieldsToInclude + ',' + accountFieldsToInclude + ',' + contactFieldsToInclude + ' from ' + objectApiName + ' where id =: recordId limit 1';
        Case c = Database.query(query);
        Map<String, Map<String, String>> caseFieldLabels = getFieldLabels(objectApiName, listOfCaseFields);
        for(String s: listOfCaseFields){
            caseFieldLabels.get(s).put('value', processFieldValue(c.get(s)));
        }
        
        Map<String, Map<String, String>> accountFieldLabels = getFieldLabels('Account', listOfAccountFields);
        for(String s: listOfAccountFields){
            accountFieldLabels.get(s).put('value', processFieldValue(c.Account.get(s)));
            caseFieldLabels.put('Account.'+s, accountFieldLabels.get(s));
        }
        
        Map<String, Map<String, String>> contactFieldLabels = getFieldLabels('Contact', listOfContactFields);
        for(String s: listOfContactFields){
            contactFieldLabels.get(s).put('value', processFieldValue(c.Contact.get(s)));
            caseFieldLabels.put('Contact.'+s, contactFieldLabels.get(s));
        }
        
        return caseFieldLabels;
    }

	public static String processFieldValue(Object fieldValue) {
        if (fieldValue instanceof Address) {
            Address address = (Address)fieldValue;
            String street = address.getStreet() != null ? address.getStreet() : '';
            String city = address.getCity() != null ? address.getCity() : '';
            String country = address.getCountry() != null ? address.getCountry() : '';
            String provience = address.getState() != null ? address.getState() : '';
            String postalCode = address.getPostalCode() != null ? address.getPostalCode() : '';
            return '' + street + ',' + city + ',' + country + ',' + provience + ',' + postalCode; 
        }
        return String.valueOf(fieldValue);
    }
    
    public static Map<String, Map<String, String>> getFieldLabels(String objectApiName, List<String> fieldApiNames) {
        // Map to store the field API names and their corresponding labels
        Map<String, Map<String, String>> fieldLabels = new Map<String, Map<String, String>>();
        
        try {
            // Get the SObjectType for the provided object API name
            Schema.SObjectType sObjectType = Schema.getGlobalDescribe().get(objectApiName);
            if (sObjectType != null) {
                // Get the map of fields for the object
                Map<String, Schema.SObjectField> fieldsMap = sObjectType.getDescribe().fields.getMap();
                
                // Iterate over the provided field API names and get their labels
                for (String fieldApiName : fieldApiNames) {
                    if (fieldsMap.containsKey(fieldApiName)) {
                        fieldLabels.put(fieldApiName, new Map<String, String>{'label' => fieldsMap.get(fieldApiName).getDescribe().getLabel()});
                    } else {
                        // Handle cases where the field API name does not exist
                        fieldLabels.put(fieldApiName, new Map<String, String>{'label' => 'Field Not Found'});
                    }
                }
            }
        } catch (Exception e) {
            // Handle any exceptions that occur
            throw new AuraHandledException('Error retrieving field labels: ' + e.getMessage());
        }
        
        return fieldLabels;
    }

}