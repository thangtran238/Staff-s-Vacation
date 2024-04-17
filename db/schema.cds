namespace vacation;

using {
    cuid,
    managed
} from '@sap/cds/common';

type Role   : String enum {
    staff;
    manager;
}

type Status : String enum {
    pending;
    accepted;
    rejected;
}

@assert.unique: {username: [username]}
entity Users : cuid, managed {
    username       : String;
    password       : String;
    fullName       : String;
    isActive       : Boolean default true;
    address        : String;
    role           : Role default 'staff';
    refreshToken   : String;
    dayOffThisYear : Decimal(10, 2) default 1.25;
    dayOffLastYear : Decimal(10, 2) default 0;
    requests       : Association to many Requests
                         on requests.user = $self;
    department     : Association to one Departments;
}

entity Requests : cuid, managed {
    status       : Status default 'pending';
    reason       : String;
    user         : Association to Users;
    startDay     : Date;
    endDay       : Date;
    isOutOfDay   : Boolean default false;
    comment      : String default '';
    notification : Association to Notifications
                       on notification.request = $self;
}


entity Notifications : cuid, managed {
    sender   : Association to Users;
    receiver : Association to Users;
    message  : String;
    isRead   : Boolean default false;
    request  : Association to Requests

}

entity Departments : managed {
    key id             : Integer;
        departmentName : String;
        isHRDepartment : Boolean default false;
        members        : Association to many Users
                             on members.department = $self;
        isActive       : Boolean default true;

}

entity Calendar : cuid, managed {
    startDay    : Date;
    endDay      : Date;
    holidayName : String;
}
