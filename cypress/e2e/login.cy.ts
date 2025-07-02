describe('E2E LoginComponent', () => {
    beforeEach(() => {
      cy.visit('/UserRegistration'); // Visita la página de login antes de cada prueba
    });

    it('Should display email and password fields', () => {
        cy.get('input[formControlName="email"]').should('be.visible');
        cy.get('input[formControlName="password"]').should('be.visible');
    });
      
    it('Should validate errors when fields are left empty', () => {
        cy.get('#logIn').click(); // Intenta hacer login sin llenar los campos
        cy.get('.text-danger').should('contain', 'El email es requerido');
        cy.get('.text-danger').should('contain', 'La contraseña es requerida');
    });
      
    it('Should display an error for an invalid email', () => {
        cy.get('input[formControlName="email"]').type('correo_invalido');
        cy.get('#logIn').click();
        cy.get('.text-danger').should('contain', 'El email debe tener un formato válido.');
    });
      
    it('Should display an error for incorrect credentials', () => {
        cy.get('input[formControlName="email"]').type('usuariotest@correo.com');
        cy.get('input[formControlName="password"]').type('clave_incorrecta');
        cy.get('#logIn').click();
      
        cy.get('.text-danger').should('contain', 'El mail o la contraseña es incorrecto');
    });

    
    it('Should allow toggling password visibility by clicking the icon', () => {
        cy.get('input[formControlName="password"]').type('clave_secreta');
        cy.get('.input-group-text').click();
        cy.get('input[formControlName="password"]').should('have.attr', 'type', 'text');
    });
    
    it('Should allow login with correct credentials (with MOCK)', () => {
        const mockResponse = {
          accessToken: 'mocked-token-123',
          user: {
            id: 1,
            name: 'Usuario Prueba',
            email: 'test@example.com'
          }
        };
        cy.intercept('POST', '**/api/auth/login', {
          statusCode: 200,
          body: mockResponse
        }).as('loginRequest');
    
        cy.fixture('data.json').then((user) => {
          cy.get('input[formControlName="email"]').type(user.email);
          cy.get('input[formControlName="password"]').type('clave_correcta');
        });
      
        cy.get('#logIn').click();
      
        cy.wait('@loginRequest').then((interception) => {
            if (interception.response){  // Lo tuve que poner asi pq typescrip como que no sabe si siempre va a tener un valor digamos 
                expect(interception.response.statusCode).to.eq(200);
                expect(interception.response.body.accessToken).to.eq(mockResponse.accessToken);
            }else {
                throw new Error('No se recibió respuesta en la interceptación');
            }
        });
    
        cy.url().should('eq', Cypress.config().baseUrl + '/');
      });      
});
