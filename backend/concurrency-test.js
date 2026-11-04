
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2YWU5YzcxZDhkMzRiNjFlMjkzOGY3ZWMiLCJyb2xlIjoiZ3Vlc3QiLCJpYXQiOjE3OTM3NzU3MTAsImV4cCI6MTc5Mzg2MjExMH0.KwAVoczpMYyren51bkZPLXcljzb00UfoIGQQZBUCMYg";
const roomTypeId = "6ae9aaa87f31a23819bb1a96";

const booking = {
    roomTypeId,
    checkIn: "2026-11-20",
    checkOut: "2026-11-22",
    roomsBooked: 1
};

async function bookRoom() {
    const response = await fetch("http://localhost:5000/api/reservations", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(booking)
    });

    const data = await response.json();

    return {
        status: response.status,
        message: data.message
    };
}

async function testConcurrency() {
    const results = await Promise.allSettled([
        bookRoom(),
        bookRoom()
    ]);

    console.log(results);
}

testConcurrency();
