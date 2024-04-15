using vacation from '../db/schema';

type keyword {
    nameStaff  : String;
    date       : Date;
    department : Integer;
}

service ManagerService @(path: '/manage') {

    entity Requests as projection on vacation.Requests;
    function getRequest(request : String)                                            returns String;
    function getRequests()                                                           returns String;
    action   createDepartment(departmentName : String)                               returns String;
    action   inviteMember(department : Integer, members : array of String)           returns String;
    action  updateRequest(request : String, action : String, comment : String)      returns String;
    action  getRequestsForHr(nameStaff : String null, department : Integer null, date : Date null) returns String;
}
