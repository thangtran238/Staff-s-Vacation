using vacation from '../db/schema';


service RequestService @(path: '/request') {
    entity Notifications as projection on vacation.Notifications;

    entity Requests as projection on vacation.Requests;
    action  createRequest(reason : String,startDay:Date,endDay:Date) returns String;
    action  updateRequest(reason  : String,ID : String) returns String;
    action  deleteRequest(ID : String) returns String;
   
}
