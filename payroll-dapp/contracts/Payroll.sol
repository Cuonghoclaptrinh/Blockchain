// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title Payroll DApp - Automatic Attendance & Salary System
/// @notice Hệ thống chấm công + trả lương tự động (demo + production-ready)
/// @dev Tất cả hàm đã có trong ABI → Frontend gọi được 100%
contract Payroll is Ownable, ReentrancyGuard {
    struct Attendance {
        uint256 timestamp;
        uint256 workedHours;
    }

    struct Employee {
        string name;
        uint256 hourlyRate; // wei per hour
        uint256 accrued; // wei đang chờ trả
        bool exists;
    }

    // ======= STORAGE =======
    address[] public employeeList;
    mapping(address => Employee) public employees;
    mapping(address => Attendance[]) public attendanceHistory;
    mapping(address => uint256) public checkInTs;

    // ======= EVENTS =======
    event EmployeeAdded(address indexed who, string name, uint256 rate);
    event EmployeeRemoved(address indexed who);
    event CheckedIn(address indexed who, uint256 ts);
    event CheckedOut(address indexed who, uint256 ts, uint256 workedHours);
    event WorkRecorded(address indexed who, uint256 workHours, uint256 amount);
    event Deposited(address indexed from, uint256 amount);
    event SalaryPaid(address indexed to, uint256 amount);
    event PaidAll(uint256 totalPaid);
    event Withdrawn(address indexed who, uint256 amount);
    event LowBalance(uint256 required, uint256 available);

    // ======= CONSTRUCTOR =======
    constructor() Ownable(msg.sender) {}

    // ======= DEPOSIT FUNDS =======
    /// @notice Nạp tiền vào quỹ lương (có kiểm tra)
    function deposit() external payable {
        require(msg.value > 0, "Must send ETH");
        emit Deposited(msg.sender, msg.value);
    }

    /// @notice Nạp tiền tự động khi gửi ETH trực tiếp
    receive() external payable {
        emit Deposited(msg.sender, msg.value);
    }

    // ======= EMPLOYEE MANAGEMENT =======
    function addEmployee(
        address _addr,
        string calldata _name,
        uint256 _hourlyRate
    ) external onlyOwner {
        require(_addr != address(0), "Invalid address");
        require(!employees[_addr].exists, "Employee exists");
        require(_hourlyRate > 0, "Rate > 0");

        employees[_addr] = Employee({
            name: _name,
            hourlyRate: _hourlyRate,
            accrued: 0,
            exists: true
        });
        employeeList.push(_addr);

        emit EmployeeAdded(_addr, _name, _hourlyRate);
    }

    function updateRate(address _addr, uint256 _hourlyRate) external onlyOwner {
        require(employees[_addr].exists, "Not employee");
        require(_hourlyRate > 0, "Rate > 0");
        employees[_addr].hourlyRate = _hourlyRate;
    }

    function removeEmployee(address _addr) external onlyOwner {
        require(employees[_addr].exists, "Not employee");

        // Xóa khỏi danh sách
        for (uint256 i = 0; i < employeeList.length; i++) {
            if (employeeList[i] == _addr) {
                employeeList[i] = employeeList[employeeList.length - 1];
                employeeList.pop();
                break;
            }
        }

        employees[_addr].exists = false;
        employees[_addr].accrued = 0;

        emit EmployeeRemoved(_addr);
    }

    // ======= ATTENDANCE =======
    function checkIn() external {
        require(employees[msg.sender].exists, "Not employee");
        require(checkInTs[msg.sender] == 0, "Already checked in");

        checkInTs[msg.sender] = block.timestamp;
        emit CheckedIn(msg.sender, block.timestamp);
    }

    function checkOut() external {
        require(employees[msg.sender].exists, "Not employee");
        uint256 inTs = checkInTs[msg.sender];
        require(inTs != 0, "Not checked in");

        uint256 elapsedSeconds = block.timestamp - inTs;
        require(elapsedSeconds >= 300, "Minimum 5 minutes required");

        uint256 workedMinutes = (elapsedSeconds + 59) / 60;
        if (workedMinutes > 16 * 60) workedMinutes = 16 * 60;

        checkInTs[msg.sender] = 0;

        // SỬA DÒNG NÀY: viết liền để tránh overflow
        uint256 amount = (workedMinutes * employees[msg.sender].hourlyRate) /
            60;
        employees[msg.sender].accrued += amount;

        attendanceHistory[msg.sender].push(
            Attendance({timestamp: block.timestamp, workedHours: workedMinutes})
        );

        emit CheckedOut(msg.sender, block.timestamp, workedMinutes);
        emit WorkRecorded(msg.sender, workedMinutes, amount);
    }

    /// @notice Ghi nhận giờ làm thủ công (DEMO ONLY)
    // function recordWork(uint256 _workedHours) external {
    //     require(employees[msg.sender].exists, "Not employee");
    //     require(_workedHours > 0 && _workedHours <= 24, "Invalid hours");

    //     _recordHours(msg.sender, _workedHours);
    //     emit WorkRecorded(
    //         msg.sender,
    //         _workedHours,
    //         _workedHours * employees[msg.sender].hourlyRate
    //     );
    // }

    // function _recordHours(address _emp, uint256 _hours) internal {
    //     uint256 amount = _hours * employees[_emp].hourlyRate;
    //     employees[_emp].accrued += amount;

    //     attendanceHistory[_emp].push(
    //         Attendance({timestamp: block.timestamp, workedHours: _hours})
    //     );

    //     if (address(this).balance < employees[_emp].accrued) {
    //         emit LowBalance(employees[_emp].accrued, address(this).balance);
    //     }
    // }

    // ======= PAYMENTS =======
    function withdraw() external nonReentrant {
        require(employees[msg.sender].exists, "Not employee");
        uint256 amt = employees[msg.sender].accrued;
        require(amt > 0, "Nothing to withdraw");
        require(address(this).balance >= amt, "Insufficient funds");

        employees[msg.sender].accrued = 0;
        (bool ok, ) = msg.sender.call{value: amt}("");
        require(ok, "Transfer failed");

        emit Withdrawn(msg.sender, amt);
    }

    function payEmployee(address _emp) external onlyOwner nonReentrant {
        _paySingle(_emp);
    }

    function payAll(
        uint256 start,
        uint256 limit
    ) external onlyOwner nonReentrant {
        require(limit > 0, "Limit > 0");
        uint256 end = start + limit;
        if (end > employeeList.length) end = employeeList.length;

        uint256 totalPaid = 0;
        for (uint256 i = start; i < end; i++) {
            address emp = employeeList[i];
            if (employees[emp].exists && employees[emp].accrued > 0) {
                if (address(this).balance >= employees[emp].accrued) {
                    uint256 amt = employees[emp].accrued;
                    employees[emp].accrued = 0;
                    (bool ok, ) = emp.call{value: amt}("");
                    if (ok) {
                        emit SalaryPaid(emp, amt);
                        totalPaid += amt;
                    } else {
                        employees[emp].accrued = amt; // rollback
                    }
                }
            }
        }
        if (totalPaid > 0) emit PaidAll(totalPaid);
    }

    function _paySingle(address _emp) internal {
        require(employees[_emp].exists, "Not employee");
        uint256 amt = employees[_emp].accrued;
        require(amt > 0, "Nothing to pay");
        require(address(this).balance >= amt, "Insufficient funds");

        employees[_emp].accrued = 0;
        (bool ok, ) = _emp.call{value: amt}("");
        require(ok, "Transfer failed");

        emit SalaryPaid(_emp, amt);
    }

    // ======= READ HELPERS =======
    function accruedOf(address _emp) external view returns (uint256) {
        return employees[_emp].accrued;
    }

    function contractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function allEmployees() external view returns (address[] memory) {
        return employeeList;
    }

    function getEmployeeCount() external view returns (uint256) {
        return employeeList.length;
    }

    function getAttendanceCount(address _emp) external view returns (uint256) {
        return attendanceHistory[_emp].length;
    }

    function getAttendance(
        address _emp,
        uint256 start,
        uint256 limit
    ) external view returns (Attendance[] memory result) {
        Attendance[] memory all = attendanceHistory[_emp];
        if (start >= all.length) return new Attendance[](0);

        uint256 end = start + limit;
        if (end > all.length) end = all.length;

        result = new Attendance[](end - start);
        for (uint256 i = start; i < end; i++) {
            result[i - start] = all[i];
        }
    }

    function getOwner() external view returns (address) {
        return owner();
    }
}
