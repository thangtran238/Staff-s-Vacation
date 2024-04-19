using vacation from '../db/schema';


service RequestService @(path: '/request') {

    entity Calendar as projection on vacation.Calendar;
    function getRequests(request : String)                                  returns String;
    action   createRequest(reason : String, startDay : Date, endDay : Date) returns String;
    action   updateRequest(reason : String, ID : String, startDay : Date, endDay : Date)                    returns String;
    action   deleteRequest(ID : String)                                     returns String;

}
