using vacation from '../db/schema';

service ManagerService @(path: '/manage') {

    entity Requests      as projection on vacation.Requests;
    function getRequest(request : String)                                  returns String;
    function getRequests()                                                 returns String;
    action   createDepartment(departmentName : String)                     returns String;
    action   inviteMember(department : Integer, members : array of String) returns String;
    action   updateRequest(request : String, action : String)              returns String;
}
