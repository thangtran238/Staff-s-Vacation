using vacation from '../db/schema';

type keyword {
    nameStaff  : String;
    date       : Date;
    department : Integer;
}

service ManagerService @(path: '/manage') {
    entity Calendar as projection on vacation.Calendar;
    function getNotifications(notify : String)                                                             returns String;
    action   createDepartment(departmentName : String)                                                     returns String;
    action   inviteMember(department : Integer, members : array of String)                                 returns String;
    action   updateRequest(request : String, action : String, comment : String)                            returns String;
    function getRequests(request : String)                                                                 returns String;
    function getRequestsForHR(staffName : String, department : String, startDay : String, endDay : String) returns String;

}
