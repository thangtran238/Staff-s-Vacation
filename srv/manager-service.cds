using vacation from '../db/schema';

type keyword {
    nameStaff  : String;
    date       : Date;
    department : Integer;
}

service ManagerService @(path: '/manage') {

    function getNotifications(notify : String)                                  returns String;
    function getRequests(request : String)                                      returns String;
    action   createDepartment(departmentName : String)                          returns String;
    action   inviteMember(department : Integer, members : array of String)      returns String;
    action   updateRequest(request : String, action : String, comment : String) returns String;

}
